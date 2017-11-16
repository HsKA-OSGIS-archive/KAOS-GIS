Ext.define('Koala.view.panel.MobileAddLayerController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.k-panel-mobileaddlayer',

    /**
     * Prepares the form regarding the config.
     */
    onInit: function() {
        var view = this.getView();
        var appContext = BasiGX.util.Application.getAppContext();
        var wmsUrl = appContext.wmsUrls;
        var versionsAutomatically = view.getVersionsWmsAutomatically();
        var countUrls = wmsUrl.length;

        if (versionsAutomatically) {
            view.down('container[name=wmsVersionsContainer]').setHidden(true);
        } else {
            view.down('container[name=wmsVersionsContainer]').setHidden(false);

        }
        if (countUrls === 0) {
            view.down('button[name=pickerbutton]').setHidden(true);
        } else {
            view.down('button[name=pickerbutton]').setHidden(false);
            //correct data for the pickerfield
            var data = [];

            Ext.each(wmsUrl, function(wms) {
                data.push({text: wms, value: wms});
            });
            view.pickerdata = data;
        }

        var defaultValue = wmsUrl[0];
        var urlField = view.down('urlfield[name=addWmsUrlField]');
        urlField.setValue(defaultValue);
    },

    /**
     * Will be called with the get layer's button. Issues a GetCapabilities
     * request and sets up handlers for reacting on the response.
     */
    requestGetCapabilities: function() {

        var me = this;
        var view = this.getView();
        var form = view.down('formpanel');
        view.setMasked({
            xtype: 'loadmask',
            message: 'Loading'
        });
        me.removeAddLayersComponents();
        var values = form.getValues();
        var url = values.addWmsUrlField;
        var version;
        var versionAutomatically = view.getVersionsWmsAutomatically();

        if (versionAutomatically === false) {
            version = values.version;
        } else {
            // try to detect the WMS version we should try next
            var triedVersions = view.getTriedVersions();
            var versionsToTry = view.getVersionArray();

            Ext.each(versionsToTry, function(currentVersion) {
                var alreadyTried = Ext.Array.contains(
                    triedVersions, currentVersion
                );

                if (!alreadyTried) {
                    version = currentVersion;
                    triedVersions.push(currentVersion);
                    return false;
                }
            });
        }

        if (!version) {
            // should only happen if all versions
            // have been tried unsuccessful
            view.setMasked(false);
            Ext.toast(me.getViewModel().get('errorRequestFailed'), 3000);
            view.setTriedVersions([]);
            return;
        }

        Ext.Ajax.request({
            url: url,
            method: 'GET',
            params: {
                REQUEST: 'GetCapabilities',
                SERVICE: 'WMS',
                VERSION: version
            },
            scope: me,
            success: me.onGetCapabilitiesSuccess,
            failure: me.onGetCapabilitiesFailure
        });
    },

    /**
     * Remove the checkboxes for layers from previous requests, and also the
     * interact-toolbar.
     */
    removeAddLayersComponents: function() {
        var view = this.getView();
        var fs = view.down('[name=fs-available-layers]');
        var tb = view.down('toolbar[name=interact-w-available-layers]');

        fs.removeAll();

        if (tb) {
            view.remove(tb);
        }

    },

    /**
     * Called if we could successfully query for the capabilities of a WMS, this
     * method will examine the answer and eventually set up a fieldset for all
     * the layers that we have found in the server's answer.
     *
     * @param response {XMLHttpRequest} The response of the request.
     */
    onGetCapabilitiesSuccess: function(response) {
        var me = this;
        var view = this.getView();
        var viewModel = me.getViewModel();
        var parser = viewModel.get('parser');
        var result;
        var isLastAvailableVersion = view.getVersionArray().length ===
            view.getTriedVersions().length;
        try {
            result = parser.read(response.responseText);
        } catch (ex) {
            if (isLastAvailableVersion) {
                Ext.toast(me.viewModel.get('errorCouldntParseResponse'), 3000);
                return;
            }
            me.requestGetCapabilities();
            return;
        }

        var compatibleLayers = me.isCompatibleCapabilityResponse(result);
        if (!compatibleLayers) {
            if (isLastAvailableVersion) {
                Ext.toast(me.viewModel.get('errorIncompatibleWMS'), 3000);
                return;
            }
        }
        me.fillAvailableLayersFieldset(compatibleLayers);
        me.updateControlToolbarState();
        view.setMasked(false);
    },

    /**
     * Called if we could not successfully query for the capabiliteis of a WMS.
     *
     * @param response {XMLHttpRequest} The response of the request.
     */
    onGetCapabilitiesFailure: function() {
        var me= this;
        var view = this.getView();
        var versionAutomatically = view.getVersionsWmsAutomatically();
        if (versionAutomatically === false) {
            Ext.toast(me.getViewModel().get('errorRequestFailed'), 3000);
            view.setMasked(false);
            return;
        } else {
            // we will try another WMS version automatically...
            me.requestGetCapabilities();
        }
    },

    /**
     * Checks if the passed capabilities object (from the #parser) is
     * compatible. It woill return an array of layers if we could determine any,
     * and the boolean value `false` if not.
     *
     * @param {Object} capabilities The GetCapabbilties object as it is returned
     *     by our parser.
     * @return {ol.layer.Tile[]|boolean} Eitehr an array of comüatible layers or
     *     `false`.
     */
    isCompatibleCapabilityResponse: function(capabilities) {
        var me = this;
        var view = this.getView();
        if (!capabilities) {
            return false;
        }
        var version = capabilities.version;
        if (version !== '1.1.1' && version !== '1.3.0') {
            return false;
        }
        var compatible = [];
        var map = BasiGX.util.Map.getMapComponent().getMap();
        var mapProj = map.getView().getProjection().getCode();

        // same in both versions
        var layers = capabilities.Capability.Layer.Layer;
        var url = capabilities.Capability.Request.GetMap.
            DCPType[0].HTTP.Get.OnlineResource;

        var includeSubLayer = view.getIncludeSubLayer();

        Ext.each(layers, function(layer) {
            var olLayer = me.getOlLayer(layer, version, mapProj, url);
            if (olLayer) {
                compatible.push(olLayer);
            }

            if (includeSubLayer && Ext.isArray(layer.Layer)) {
                Ext.each(layer.Layer, function(subLayer) {
                    var subOlLayer = me.getOlLayer(
                        subLayer, version, mapProj, url
                    );
                    if (subOlLayer) {
                        compatible.push(subOlLayer);
                    }
                });
            }
        });

        return compatible.length > 0 ? compatible : false;
    },

    /**
     * A utility method that creates an ol.layer.Tile with a ol.source.TileWMS
     * from the properties of a layer from a getCapabilities response.
     *
     * @param {Object} capLayer A layer from a GetCapabilities response
     * @param {String} version The WMS version.
     * @param {String} mapProj The map projection as string.
     * @param {String} url The WMS URL.
     * @return {ol.layer.Tile} The created layer or `undefined`.
     */
    getOlLayer: function(capLayer, version, mapProj, url) {
        // This really should not matter, as ol3 can reproject in the client
        // At least it shoudl be configurable
        if (version === '1.3.0' &&
            Ext.isArray(capLayer.CRS) &&
            !Ext.Array.contains(capLayer.CRS, mapProj)) {
            // only available for 1.3.0
            return;
        }
        var style = capLayer.Style;
        var olSource = new ol.source.TileWMS({
            url: url,
            params: {
                LAYERS: capLayer.Name,
                STYLES: style ? style[0].Name : '',
                VERSION: version
            }
        });
        var olLayer = new ol.layer.Tile({
            topic: true,
            name: capLayer.Title,
            source: olSource,
            legendUrl: style ? style[0].LegendURL[0].OnlineResource : null
        });
        return olLayer;
    },

    /**
     * Takes an array of OpenLayers layers (as gathered by the method to fetch
     * them from the capabilities object #isCompatibleCapabilityResponse) and
     * updates the avaialable layers fieldset with matching entries.
     *
     * @param {ol.layer.Tile[]} layers The layers for which the we shall fill
     *     the fieldset.
     */
    fillAvailableLayersFieldset: function(layers) {
        var me = this;
        var view = this.getView();
        me.removeAddLayersComponents();
        var fs = view.down('[name=fs-available-layers]');
        var checkBoxes = [];
        var candidatesInitiallyChecked = view.getCandidatesInitiallyChecked();

        Ext.each(layers, function(layer) {
            if (layer) {
                view.setTriedVersions([]);
                checkBoxes.push({
                    xtype: 'checkboxfield',
                    label: layer.get('name'),
                    labelWidth: '80%',
                    checked: candidatesInitiallyChecked,
                    olLayer: layer
                });
            }

        });
        fs.add(checkBoxes);

        var tbItems = [];

        var addCheckedLayersBtn = view.down('button[name=add-checked-layers]');
        if (!addCheckedLayersBtn) {
            tbItems.push({
                xtype: 'button',
                name: 'add-checked-layers',
                bind: {
                    text: '{addCheckedLayersBtnText}'
                },
                handler: me.addCheckedLayers,
                scope: me
            });
        }

        view.down('formpanel').add({
            xtype: 'toolbar',
            name: 'interact-w-available-layers',
            items: tbItems
        });
    },

    /**
     * Updates the disabled state of the buttons to control the layer
     * checkboxes (e.g. check all, uncheck all, add selected).
     */
    updateControlToolbarState: function() {
        var view = this.getView();
        var fs = view.down('[name=fs-available-layers]');
        var allCbs = fs.query('checkboxfield');
        var allChecked = fs.query('[checked=true]');
        var allDisabled = fs.query('[disabled=true]');
        var checkAllBtn = view.down('[name=check-all-layers]');
        var uncheckAllBtn = view.down('[name=uncheck-all-layers]');
        var addBtn = view.down('[name=add-checked-layers]');
        if (allCbs.length === 0) {
            // no checkboxes, also no control toolbar, return
            return;
        }
        if (allDisabled.length === allCbs.length) {
            // all checkboxes are disabled, all controls can be disabled
            addBtn.setDisabled(true);
            if (checkAllBtn) {
                checkAllBtn.setDisabled(true);
            }
            if (uncheckAllBtn) {
                uncheckAllBtn.setDisabled(true);
            }
            return;
        }
        if (allChecked.length > 0) {
            // at least one checkbox is checked
            addBtn.setDisabled(false);
        } else {
            // not even one is checked
            addBtn.setDisabled(true);
        }

        if (checkAllBtn) {
            if (allCbs.length === allChecked.length) {
                // all are checked already
                checkAllBtn.setDisabled(true);
            } else {
                checkAllBtn.setDisabled(false);
            }
        }
        if (uncheckAllBtn) {
            if (allChecked.length === 0) {
                // not a single one is checked
                uncheckAllBtn.setDisabled(true);
            } else {
                uncheckAllBtn.setDisabled(false);
            }
        }
    },

    /**
     * Examines the available layers fieldset, and adds all checked layers to
     * the map.
     */
    addCheckedLayers: function() {
        var me = this;
        var view = this.getView();
        var fs = view.down('[name=fs-available-layers]');
        var checkboxes = fs.query('checkboxfield');
        var map = BasiGX.util.Map.getMapComponent().getMap();
        Ext.each(checkboxes, function(checkbox) {
            if (checkbox.isChecked() && checkbox.isDisabled() !== true) {
                me.getView().fireEvent('beforewmsadd', checkbox.olLayer);
                map.addLayer(checkbox.olLayer);
                me.fireEvent('wmsadd', checkbox.olLayer);
                checkbox.setDisabled(true);
            }
        });
        me.updateControlToolbarState();
    },


    createPicker: function() {
        var me = this;
        var view = this.getView();
        var model = view.getViewModel();
        var data = view.pickerdata;
        var urlPicker = Ext.create('Ext.Picker', {
            xtype: 'pickerfield',
            doneButton: model.get('pickerDoneBtnText'),
            cancelButton: model.get('pickerCancelBtnText'),
            slots: [{
                name: 'picker',
                data: data
            }],
            listeners: {
                change: function(picker, value) {
                    me.removeAddLayersComponents();
                    var urlField = Ext.ComponentQuery.query('urlfield[name=addWmsUrlField]')[0];
                    urlField.setValue(value.picker);
                    view.setTriedVersions([]);
                }
            }
        });
        urlPicker.show();
    }

});

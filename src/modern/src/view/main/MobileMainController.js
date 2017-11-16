/* Copyright (c) 2015-present terrestris GmbH & Co. KG
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * @class Koala.view.main.MobileMainController
 */
Ext.define('Koala.view.main.MobileMainController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.mobile-main',

    requires: [
        'Koala.util.Fullscreen'
    ],

    layersAlreadyAdded: [],

    chartingLayer: null,

    /**
     * TODO needed only while developing, will eventually be removed
     */
    addDummyDevLayers: function() {
        var layers = [
            //'08e36567-cf9a-4e22-8774-e83a3452da7b' // odl_brutto_10min
            //'f917f393-fb9b-4345-99cf-8d2fcfab8d3d' // niederschlag_24h
            //'83cb1604-3d8c-490b-b807-5e7cb17f3b22' // odl_brutto_24h
            //'45dd5d65-630a-42d9-9f86-6c718dab0412' // barchart layer
            // ,'25e17589-6694-4d58-8efb-0c400415aec3' // vector layer
        ];
        Ext.each(layers, function(uuid) {
            Koala.util.Layer.addLayerByUuid(uuid);
        });
    },

    onMainPanelPainted: function() {
        var me = this;
        var view = me.getView();
        // me.addDummyDevLayers(); // TODO remove!!!!!!
        me.setupChartingLayerChangeHandler();
        me.setupMapClickHandler();

        //open help initially if user is neither "ruf", "imis" nor "bfs"
        if (!Koala.util.AppContext.intersectsImisRoles(['ruf', 'imis', 'bfs'])) {
            view.down('k-panel-mobilehelp').show();
        }
    },

    setupChartingLayerChangeHandler: function() {
        var me = this;
        var legends = Ext.ComponentQuery.query('k-panel-mobilelegend');
        Ext.each(legends, function(legend) {
            legend.on('chartinglayerchange', me.onChartingLayerChanged, me);
        });
        me.on('destroy', me.teardownChartingLayerChangeHandler, me);
    },

    teardownChartingLayerChangeHandler: function() {
        var me = this;
        var legends = Ext.ComponentQuery.query('k-panel-mobilelegend');
        Ext.each(legends, function(legend) {
            legend.un('chartinglayerchange', me.onChartingLayerChanged, me);
        });
    },

    setupMapClickHandler: function() {
        var me = this;
        var mapComponent = this.getView().down('basigx-component-map');
        var map = mapComponent.getMap();
        map.on('singleclick', me.onMapSingleClick, me);
        me.on('destroy', me.teardownMapClickHandler, me);
    },

    teardownMapClickHandler: function() {
        var me = this;
        var mapComponent = this.getView().down('basigx-component-map');
        var map = mapComponent.getMap();
        map.un('singleclick', me.onMapSingleClick, me);
    },

    /**
     * Handle the case when a singleclick / tap was fired on the map.
     */
    onMapSingleClick: function(evt) {
        var me = this;
        var coordinate = evt.coordinate;
        var mapProj = evt.map.getView().getProjection().getCode();

        //show geographic coords regardless og map projection
        var lonlat_coord = ol.proj.transform(coordinate,mapProj,'EPSG:4326');
        var lon = parseFloat(lonlat_coord[0]).toFixed(2);
        var lat = parseFloat(lonlat_coord[1]).toFixed(2);

        // Coordinate Info
        Ext.toast({
            message: 'Longitude , Latitude' + '<br/>' + lon + ' , ' + lat + ' ',
            timeout: 3000
        });

        if (me.pendingRequest) {
            me.pendingRequest.abort();
        }
        var LayerUtil = Koala.util.Layer;
        if (!me.chartingLayer) {
            // we may be want show tooltips?
            return;
        }
        if (!LayerUtil.isChartableLayer(me.chartingLayer)) {
            // Should never happen™
            Ext.log.warn('Illegal chartable layer defined');
            return;
        }

        if (LayerUtil.isWmsLayer(me.chartingLayer)) {
            var mapView = evt.map.getView();
            var resolution = mapView.getResolution();
            var projCode = mapView.getProjection().getCode();
            // source is either a TileWMS or ImageWMS
            var urlParams = {
                'INFO_FORMAT': 'application/json',
                'FEATURE_COUNT': '1'
            };
            var url = me.chartingLayer.getSource().getGetFeatureInfoUrl(
                coordinate, resolution, projCode, urlParams
            );
            me.pendingRequest = Ext.Ajax.request({
                url: url,
                scope: me,
                callback: function() {
                    me.pendingRequest = null;
                },
                success: me.onWmsGetFeatureSuccess,
                failure: me.onWmsGetFeatureFailure
            });
        } else if (LayerUtil.isVectorLayer(me.chartingLayer)) {
            var source = me.chartingLayer.getSource();
            var closestFeature = source.getClosestFeatureToCoordinate(coordinate);
            var extentFromCoord = me.extentFromCoordinate(coordinate, resolution);
            var featuresInExtent = source.getFeaturesInExtent(extentFromCoord);
            var closestInExtent = false;
            Ext.each(featuresInExtent, function(featureInExtent) {
                if (featureInExtent === closestFeature) {
                    closestInExtent = true;
                    return false; // break early
                }
            });
            if (closestInExtent) {
                me.chartableFeatureFound(closestFeature);
            }
        }
    },

    /**
     * A utility helper to create an extent in coordinate units for checking if
     * the nearest vector feature of a clicked coordinate is actually really
     * near considering the current map views resolution.
     *
     * @param {ol.Coordinate} coord The coordinate to build the extent around.
     * @param {Number} resolution The current map view resolution.
     * @return {ol.Extent} The created extent.
     */
    extentFromCoordinate: function(coord, resolution) {
        var bufferPx = 5;
        var bufferinCoordUnits = bufferPx * resolution;
        var extent = [coord[0], coord[1], coord[0], coord[1]];
        return ol.extent.buffer(extent, bufferinCoordUnits);
    },

    /**
     * Handles success when fetching WMS GetFeatureInfo requests by parsing the
     * result and eventually calling into #chartableFeatureFound to create or
     * update a chart
     *
     * @param {XMLHttpRequest} resp The response object.
     */
    onWmsGetFeatureSuccess: function(resp) {
        var me = this;
        var mapComponent = this.getView().down('basigx-component-map');
        var map = mapComponent.getMap();
        var mapProjection = map.getView().getProjection();
        var geojsonFormat = new ol.format.GeoJSON();
        var respFeatures = geojsonFormat.readFeatures(
            resp.responseText, {
                featureProjection: mapProjection
            }
        );
        if (respFeatures && respFeatures[0]) {
            me.chartableFeatureFound(respFeatures[0]);
        }
    },

    /**
     * Examines the passed chartable feature (from WMS GFI or a vector feature)
     * and opens/updates the correct chart.
     *
     * @param {ol.Feature} feature The chartable feature.
     */
    chartableFeatureFound: function(feature) {
        var me = this;
        var view = me.getView();
        var viewModel = view.getViewModel();
        var mapComponent = this.getView().down('basigx-component-map');
        var map = mapComponent.getMap();
        var panel;
        var isCarto = Koala.util.Layer.isCartoWindowLayer(me.chartingLayer);
        var isTimeSeries = Koala.util.Layer.isTimeseriesChartLayer(me.chartingLayer);
        var isBarChart = Koala.util.Layer.isBarChartLayer(me.chartingLayer);

        if (isCarto) {
            Ext.create('Koala.view.component.CartoWindow', {
                map: map,
                layer: me.chartingLayer,
                feature: feature,
                renderTo: Ext.getBody()
            });
            return false;
        } else if (isTimeSeries && isBarChart) {
            Ext.Msg.show({
                title: viewModel.get('chartSlctnTitle'),
                message: viewModel.get('chartSlctnMsg'),
                closable: true,
                minWidth: 350,
                buttons: [{
                    text: viewModel.get('chartSlctnTimeSeriesBtn'),
                    margin: '5 5 5 5'
                },{
                    text: viewModel.get('chartSlctnBarChartBtn'),
                    margin: '5 5 5 5'
                }],
                fn: function(btnId) {
                    if (btnId === viewModel.get('chartSlctnTimeSeriesBtn')) {
                        panel = view.down('k-panel-timeserieschart');
                    } else if (btnId === viewModel.get('chartSlctnBarChartBtn')) {
                        panel = view.down('k-panel-barchart');
                    }
                    panel.getController().updateFor(me.chartingLayer, feature);
                    panel.show();
                }
            });
        } else if (isTimeSeries) {
            panel = view.down('k-panel-timeserieschart');
        } else if (isBarChart) {
            panel = view.down('k-panel-barchart');
        }
        if (panel) {
            panel.getController().updateFor(me.chartingLayer, feature);
            panel.show();
        }
    },

    /**
     * Handles errors when fetching WMS GetFeatureInfo requests fail and weren't
     * explicitly aborted.
     *
     * @param {XMLHttpRequest} resp The response object.
     */
    onWmsGetFeatureFailure: function(resp) {
        if (!resp.aborted) {
            Ext.log.error('WMS GetFeatureInfo failure', resp);
        }
    },

    /**
     * Stores the new charting layer and ensure that all existing charts are
     * removed from the fiew.
     *
     * @param {ol.layer.Layer} newChartingLayer The new layer for charting.
     */
    onChartingLayerChanged: function(newChartingLayer) {
        var me = this;
        var view = me.getView();
        var charts = view.query('d3-chart');
        // store the new charting layer
        me.chartingLayer = newChartingLayer;
        // remove existing charts
        Ext.each(charts, function(chart) {
            chart.up().remove(chart);
        });
    },

    /**
     * Toggle fullscreen mode.
     */
    toggleFullscreen: function(btn) {
        Koala.util.Fullscreen.toggleFullscreen();

        var btnClass = Koala.util.Fullscreen.isInFullscreen() ?
            'fa-compress' : 'fa-expand';
        btn.setHtml('<i class="fa ' + btnClass + ' fa-2x"></i>');
    }

});

/* Copyright (c) 2017-present terrestris GmbH & Co. KG
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
 * @class Koala.view.component.CartoWindow
 */
Ext.define('Koala.view.component.CartoWindow',{
    extend: 'Ext.Component',
    xtype: 'k-component-cartowindow',

    requires: [
        'Ext.grid.Panel',
        'Ext.grid.filters.Filters'
    ],

    cls: 'cartowindow',

    controller: 'k-component-cartowindow',
    viewModel: 'k-component-cartowindow',

    shrinkWrap: true,

    pointerMoveListener: null,

    /**
     * The minimum width of the content div of the tabs.
     * @type {Number}
     */
    contentMinWidth: 50,

    /**
     * The minimum height of the content div of the tabs.
     * @type {Number}
     */
    contentMinHeight: 50,

    config: {
        map: null,
        layer: null,
        feature: null,
        cartoWindowId: null
    },

    listeners: {
        boxready: 'onInitialize',
        initialize: 'onInitialize',
        beforedestroy: 'onBeforeDestroy',
        afterrender: function(cmp) {
            cmp.getEl().on('mousedown', (function() {
                this.mouseDown = true;
            }).bind(this));
            cmp.getEl().on('mouseup', (function() {
                this.mouseDown = false;
            }).bind(this));
            cmp.getEl().on('mouseenter', this.controller.disableMapInteractions.bind(this.controller));
            cmp.getEl().on('mouseleave', this.controller.enableMapInteractions.bind(this.controller));
            cmp.getEl().select('.x-unselectable').selectable();
        }
    }

});

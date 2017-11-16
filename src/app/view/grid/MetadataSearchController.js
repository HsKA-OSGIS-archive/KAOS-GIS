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
 * @class Koala.view.grid.MetadataSearchController
 */
Ext.define('Koala.view.grid.MetadataSearchController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.k-grid-metadatasearch',

    requires: [
        'Koala.view.window.MetadataInfo'
    ],

    addToMap: function(grid, rowIndex, colIndex, btn, evt, record) {
        // TODO, get better
        Koala.util.Layer.addLayerByUuid(record.get('fileIdentifier'));
    },

    getInfo: function(grid, rowIndex, colIndex, btn, evt, record) {
        Ext.create('Koala.view.window.MetadataInfo', {
            title: record.get('name'),
            layout: 'fit',
            record: record
        }).show();
    },

    // TODO onStoreBeforeload / onStoreLoad / setupStatusLineListeners and
    //      teardownStatusLineListeners are the same in the
    //      SpatialSearchController.

    /**
     * Before the store loads, we'll show the footer of the grid which contains
     * the status line. We'll also update the visible text with something like
     * 'Searching…'.
     */
    onStoreBeforeload: function() {
        var grid = this.getView();
        var footer = grid.down('toolbar[name="footer"]');
        var statusLine = footer.down('[name="status-line"]');
        statusLine.setHtml(grid.getViewModel().get('searchInProgressText'));
        footer.show();
    },

    /**
     * Whenever the store has loaded, we examine the resulting records. If we
     * haven't received any records, we'll tell the user (e.g. 'nothing found').
     * Otherwise we'll hide the statusbar (shown before the query was issued),
     * so that the user can browse the results.
     *
     * @param {Ext.data.Store} store The store that just loaded.
     * @param {Ext.data.Model[]} records The records that the last query
     *     returned.
     */
    onStoreLoad: function(store, records) {
        var grid = this.getView();
        var footer = grid.down('toolbar[name="footer"]');
        var statusLine = footer.down('[name="status-line"]');
        if (!records || records.length < 1) {
            statusLine.setHtml(grid.getViewModel().get('noRecordsFoundText'));
            footer.show();
        } else {
            statusLine.setHtml('');
            footer.hide();
        }
    },

    /**
     * Called on the 'boxready'-event, this methods adds listeners to store
     * events, which will update the status line of the grids (e.g. 'no data
     * found'), see also #teardownStatusLineListeners.
     *
     * @private
     */
    setupStatusLineListeners: function() {
        var me = this;
        var store = me.getView().getStore();
        store.on({
            load: me.onStoreLoad,
            beforeload: me.onStoreBeforeload,
            scope: me
        });
    },

    /**
     * Called on the beforedestroy event, this methods removes listeners to
     * store events, which we added to show information in the status line
     * (see #setupStatusLineListeners).
     *
     * @private
     */
    teardownStatusLineListeners: function() {
        var me = this;
        var store = me.getView().getStore();
        store.un({
            load: me.onStoreLoad,
            beforeload: me.onStoreBeforeload,
            scope: me
        });
    }
});

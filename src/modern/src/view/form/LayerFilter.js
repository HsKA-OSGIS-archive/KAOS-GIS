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
 * @class Koala.view.form.LayerFilter
 */
Ext.define('Koala.view.form.LayerFilter', {
    extend: 'Ext.form.Panel',
    xtype: 'k-form-layerfilter',

    requires: [
        'Ext.field.DatePicker',
        'Ext.field.Select',

        'Koala.util.Date',
        'Koala.util.Filter',

        'Koala.view.form.LayerFilterController',
        'Koala.view.form.LayerFilterModel'
    ],

    controller: 'k-form-layerfilter',
    viewModel: {
        type: 'k-form-layerfilter'
    },
    padding: 5,

    height: '95vh',

    ignoreFields: [
        'minutespinner',
        'hourspinner',
        'minminutespinner',
        'minhourspinner',
        'maxminutespinner',
        'maxhourspinner'
    ],

    listeners: {
        initialize: 'initComponent'
    },

    config: {
        metadata: null,
        filters: null,
        format: null,
        layer: null
    }

});

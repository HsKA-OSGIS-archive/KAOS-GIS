Ext.define('Koala.view.panel.MobilePanel',{
    extend: 'Ext.Panel',
    xtype: 'k-panel-mobilepanel',

    hideOnMaskTap: true,
    top: 0,
    width: '80%',
    height: '100%',
    margin: 0,
    modal: true,
    style: 'border: 0px; background: white;',

    showAnimation: {
        type: 'slideIn',
        direction: 'right'
    },
    hideAnimation: 'slideOut',

    config: {
        /**
         * If set, a close/hide tool will be rendered to the desired panel header
         * side (typically 'left' or 'right').
         */
        closeToolAlign: null
    },

    initialize: function(config) {
        var me = this;

        me.callParent([config]);

        if (me.getCloseToolAlign()) {
            me.addTool({
                type: me.getCloseToolAlign(),
                docked: me.getCloseToolAlign(),
                handler: function(panel) {
                    panel.hide();
                }
            });
        }

    }

});

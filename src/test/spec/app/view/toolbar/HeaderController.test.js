Ext.Loader.syncRequire([
    'Koala.view.toolbar.HeaderController'
]);

describe('Koala.view.toolbar.HeaderController', function() {
    describe('Basics', function() {
        it('is defined', function() {
            expect(Koala.view.toolbar.HeaderController).to.not.be(undefined);
        });
    });
});

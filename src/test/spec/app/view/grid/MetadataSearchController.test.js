Ext.Loader.syncRequire([
    'Koala.view.grid.MetadataSearchController'
]);

describe('Koala.view.grid.MetadataSearchController', function() {
    describe('Basics', function() {
        it('is defined', function() {
            expect(Koala.view.grid.MetadataSearchController).to.not.be(undefined);
        });
    });
});

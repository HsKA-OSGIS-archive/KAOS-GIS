Ext.Loader.syncRequire([
    'Koala.view.grid.SpatialSearchController'
]);

describe('Koala.view.grid.SpatialSearchController', function() {
    describe('Basics', function() {
        it('is defined', function() {
            expect(Koala.view.grid.SpatialSearchController).to.not.be(undefined);
        });
    });
});

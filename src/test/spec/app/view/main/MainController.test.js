Ext.Loader.syncRequire([
    'Koala.view.main.MainController'
]);

describe('Koala.view.main.MainController', function() {
    describe('Basics', function() {
        it('is defined', function() {
            expect(Koala.view.main.MainController).to.not.be(undefined);
        });
    });
});

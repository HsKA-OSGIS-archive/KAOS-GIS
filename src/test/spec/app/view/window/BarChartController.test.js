Ext.Loader.syncRequire([
    'Koala.view.window.BarChartController',
    'Koala.view.component.D3BarChart'
]);

describe('Koala.view.window.BarChartController', function() {
    describe('Basics', function() {
        it('is defined', function() {
            expect(Koala.view.window.BarChartController).to.not.be(undefined);
        });
    });
});

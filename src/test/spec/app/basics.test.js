describe('Basic requirements of Koala', function() {
    describe('Libraries are loaded & available in testsuite', function() {
        describe('ExtJS', function() {
            it('is defined', function() {
                expect(Ext).not.to.be(undefined);
            });
        });
        describe('OpenLayers', function() {
            it('is defined', function() {
                expect(ol).not.to.be(undefined);
            });
        });
    });
    describe('The Ext.loader is correctly configured', function() {
        it('is enabled', function() {
            var isEnabled = Ext.Loader.getConfig('enabled');
            expect(isEnabled).to.be(true);
        });
        it('has a path configured for GeoExt', function() {
            var paths = Ext.Loader.getConfig('paths');
            expect('GeoExt' in paths).to.be(true);
            expect(paths['GeoExt']).not.to.be(undefined);
        });
        it('has a path configured for BasiGX', function() {
            var paths = Ext.Loader.getConfig('paths');
            expect('BasiGX' in paths).to.be(true);
            expect(paths['BasiGX']).not.to.be(undefined);
        });
        it('has a path configured for Koala', function() {
            var paths = Ext.Loader.getConfig('paths');
            expect('Koala' in paths).to.be(true);
            expect(paths['Koala']).not.to.be(undefined);
        });
    });
});

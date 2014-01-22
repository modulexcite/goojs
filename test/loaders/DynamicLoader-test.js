define([
	'goo/entities/World',
	'goo/loaders/DynamicLoader',
	'loaders/Configs'
], function(
	World,
	DynamicLoader,
	Configs
) {
	'use strict';
	function wait(promise, time) {
		time = time || 1;
		waitsFor(function() { return promise.isResolved; }, 'promise does not get resolved', time);
	}

	describe('DynamicLoader', function() {
		var loader;
		beforeEach(function() {
			var world = new World();
			loader = new DynamicLoader({
				world: world,
				rootPath: './',
				ajax: false
			});
		});

		it('loads bundle', function() {
			// Create a bundlewrapper to preload and skip ajax
			var config = Configs.entity();
			var bundleWrapper = {};
			var bundleRef = Configs.randomRef('bundle');
			bundleWrapper[bundleRef] = Configs.get();

			loader.preload(bundleWrapper);
			// Load bundle
			var p = loader.load(bundleRef).then(function() {
				var keys = Object.keys(loader._configs);

				expect(keys).toContain(config.id);
				expect(loader._configs[config.id].components).toBeDefined();
			});

			wait(p);
		});
	});

});
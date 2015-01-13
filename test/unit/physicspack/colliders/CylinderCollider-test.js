define([
	'goo/math/Vector3',
	'goo/math/Transform',
	'goo/physicspack/colliders/CylinderCollider'
], function (
	Vector3,
	Transform,
	CylinderCollider
) {
	'use strict';

	describe('CylinderCollider', function () {

		it('can clone', function (done) {
			var collider = new CylinderCollider({
				radius: 123,
				height: 456
			});
			var clone = collider.clone();
			expect(collider).toEqual(clone);
			done();
		});

		it('can transform', function (done) {
			var collider = new CylinderCollider({
				radius: 2,
				height: 3
			});
			var transform = new Transform();
			transform.scale.set(1, 2, 3);
			collider.transform(transform, collider);
			expect(collider.radius).toEqual(4);
			expect(collider.height).toEqual(9);
			done();
		});
	});
});
define([
	'goo/loaders/handlers/ComponentHandler',
	'goo/addons/particlepack/components/ParticleComponent',
	'goo/addons/particlepack/curves/LinearCurve',
	'goo/addons/particlepack/curves/ConstantCurve',
	'goo/addons/particlepack/curves/PolyCurve',
	'goo/addons/particlepack/curves/Vector3Curve',
	'goo/addons/particlepack/curves/Vector4Curve',
	'goo/addons/particlepack/curves/LerpCurve',
	'goo/util/rsvp',
	'goo/util/ObjectUtils',
	'goo/math/Vector3',
	'goo/math/MathUtils'
], function (
	ComponentHandler,
	ParticleComponent,
	LinearCurve,
	ConstantCurve,
	PolyCurve,
	Vector3Curve,
	Vector4Curve,
	LerpCurve,
	RSVP,
	_,
	Vector3,
	MathUtils
) {
	'use strict';

	/**
	 * @extends ComponentHandler
	 * @hidden
	 */
	function ParticleComponentHandler() {
		ComponentHandler.apply(this, arguments);
		this._type = 'ParticleComponent';
	}

	ParticleComponentHandler.prototype = Object.create(ComponentHandler.prototype);
	ParticleComponentHandler.prototype.constructor = ParticleComponentHandler;
	ComponentHandler._registerClass('particle', ParticleComponentHandler);

	function constantCurve(value){
		return [{
			type: 'constant',
			offset: 0,
			options: {
				value: value
			}
		}];
	}

	/**
	 * Prepare component. Set defaults on config here.
	 * @param {Object} config
	 * @returns {Object}
	 * @private
	 */
	ParticleComponentHandler.prototype._prepare = function (config) {
		return _.defaults(config, {
			gravity: [0, 0, 0],
			seed: -1,
			shapeType: 'cone',
			sphereRadius: 1,
			sphereEmitFromShell: false,
			randomDirection: false,
			coneEmitFrom: 'base',
			boxExtents: [1, 1, 1],
			coneRadius: 1,
			coneAngle: 10,
			coneLength: 1,
			startColor: [constantCurve(1),constantCurve(1),constantCurve(1),constantCurve(1)],
			color: [constantCurve(1),constantCurve(1),constantCurve(1),constantCurve(1)],
			duration: 5,
			localSpace: true,
			startSpeed: constantCurve(5),
			localVelocity: [constantCurve(0),constantCurve(0),constantCurve(0)],
			worldVelocity: [constantCurve(0),constantCurve(0),constantCurve(0)],
			maxParticles: 100,
			emissionRate: constantCurve(10),
			startLifeTime: constantCurve(5),
			renderQueue: 3010,
			alphakill: 0,
			loop: false,
			preWarm: true,
			blending: 'NoBlending',
			depthWrite: true,
			depthTest: true,
			textureTilesX: 1,
			textureTilesY: 1,
			textureAnimationSpeed: 1,
			startSize: constantCurve(1),
			sortMode: 'none',
			billboard: true,
			size: constantCurve(1),
			startAngle: constantCurve(0),
			rotationSpeed: constantCurve(0),
			textureRef: null
		});
	};

	/**
	 * @returns {ParticleComponent} the created component object
	 * @private
	 */
	ParticleComponentHandler.prototype._create = function () {
		var component = new ParticleComponent();
		return component;
	};

	/**
	 * @param {string} ref
	 */
	ParticleComponentHandler.prototype._remove = function (entity) {
		entity.clearComponent('ParticleComponent');
	};

	function createCurve(configs, multiplier){
		multiplier = multiplier !== undefined ? multiplier : 1;

		var curve = new PolyCurve();

		for(var i=0; i<configs.length; i++){
			var config = configs[i];
			var options = config.options;
			switch(config.type){
			case 'linear':
				curve.addSegment(new LinearCurve({
					timeOffset: config.offset,
					k: options.k * multiplier,
					m: options.m * multiplier
				}));
				break;
			case 'constant':
				curve.addSegment(new ConstantCurve({
					timeOffset: config.offset,
					value: options.value * multiplier
				}));
				break;
			case 'lerp':
				curve.addSegment(new LerpCurve({
					timeOffset: config.offset,
					curveA: createCurve(options.curveA),
					curveB: createCurve(options.curveB)
				}));
				break;
			}
		}

		return curve;
	}

	function createVec3Curve(configsX, configsY, configsZ){
		return new Vector3Curve({
			x: createCurve(configsX),
			y: createCurve(configsY),
			z: createCurve(configsZ)
		});
	}
	
	function createVec4Curve(configsX, configsY, configsZ, configsW){
		return new Vector4Curve({
			x: createCurve(configsX),
			y: createCurve(configsY),
			z: createCurve(configsZ),
			w: createCurve(configsW)
		});
	}

	/**
	 * @param {Entity} entity The entity on which this component should be added.
	 * @param {Object} config
	 * @param {Object} options
	 * @returns {RSVP.Promise} promise that resolves with the component when loading is done.
	 */
	ParticleComponentHandler.prototype.update = function (entity, config, options) {
		var that = this;
		return ComponentHandler.prototype.update.call(this, entity, config, options).then(function (component) {
			if (!component) { return; }

			component.gravity.setArray(config.gravity);
			component.seed = config.seed;
			component.shapeType = config.shapeType;
			component.sphereRadius = config.sphereRadius;
			component.sphereEmitFromShell = config.sphereEmitFromShell;
			component.randomDirection = config.randomDirection;
			component.coneEmitFrom = config.coneEmitFrom;
			component.setBoxExtents(new Vector3(config.boxExtents));
			component.coneRadius = config.coneRadius;
			component.coneAngle = config.coneAngle;
			component.coneLength = config.coneLength;
			component.startColor = createVec4Curve(config.startColor[0], config.startColor[1], config.startColor[2], config.startColor[3]);
			component.color = createVec4Curve(config.color[0], config.color[1], config.color[2], config.color[3]);
			component.duration = config.duration;
			component.localSpace = config.localSpace;
			component.startSpeed = createCurve(config.startSpeed);
			component.localVelocity = createVec3Curve(config.localVelocity[0], config.localVelocity[1], config.localVelocity[2]);
			component.worldVelocity = createVec3Curve(config.worldVelocity[0], config.worldVelocity[1], config.worldVelocity[2]);
			component.maxParticles = config.maxParticles;
			component.emissionRate = createCurve(config.emissionRate);
			component.startLifeTime = createCurve(config.startLifeTime);
			component.renderQueue = config.renderQueue;
			component.alphakill = config.alphakill;
			component.loop = config.loop;
			component.preWarm = config.preWarm;
			component.blending = config.blending;
			component.depthWrite = config.depthWrite;
			component.depthTest = config.depthTest;
			component.textureTilesX = config.textureTilesX;
			component.textureTilesY = config.textureTilesY;
			component.textureAnimationSpeed = config.textureAnimationSpeed;
			component.startSize = createCurve(config.startSize);
			component.sortMode = {
				'none': ParticleComponent.SORT_NONE,
				'camera_distance': ParticleComponent.SORT_CAMERA_DISTANCE
			}[config.sortMode];
			component.billboard = config.billboard;
			component.size = createCurve(config.size);
			component.startAngle = createCurve(config.startAngle, MathUtils.DEG_TO_RAD);
			component.rotationSpeed = createCurve(config.rotationSpeed, MathUtils.DEG_TO_RAD);

			component.stop();
			component.play();

			var promises = [];

			var textureRef = config.texture && config.texture.enabled && config.texture.textureRef;
			if(textureRef){
				promises.push(that._load(textureRef, options).then(function (texture) {
					component.texture = texture;
					return component;
				}).then(null, function (err) {
					throw new Error('Error loading texture: ' + textureRef + ' - ' + err);
				}));
			} else {
				component.texture = null;
			}
			
			return RSVP.all(promises).then(function () {
				return component;
			});
		});
	};

	return ParticleComponentHandler;
});
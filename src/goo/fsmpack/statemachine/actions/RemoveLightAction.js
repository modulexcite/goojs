var Action = require('../../../fsmpack/statemachine/actions/Action');

	'use strict';

	function RemoveLightAction(/*id, settings*/) {
		Action.apply(this, arguments);
	}

	RemoveLightAction.prototype = Object.create(Action.prototype);
	RemoveLightAction.prototype.constructor = RemoveLightAction;

	RemoveLightAction.external = {
		name: 'Remove Light',
		type: 'light',
		description: 'Removes the light attached to the entity',
		parameters: [],
		transitions: []
	};

	RemoveLightAction.prototype._run = function (fsm) {
		var entity = fsm.getOwnerEntity();
		if (entity.hasComponent('LightComponent')) {
			entity.clearComponent('LightComponent');
		}
	};

	module.exports = RemoveLightAction;
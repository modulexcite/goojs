var Action = require('../../../fsmpack/statemachine/actions/Action');

	'use strict';

	function ShowAction(/*id, settings*/) {
		Action.apply(this, arguments);
	}

	ShowAction.prototype = Object.create(Action.prototype);
	ShowAction.prototype.constructor = ShowAction;

	ShowAction.external = {
		name: 'Show',
		type: 'display',
		description: 'Makes an entity visible',
		parameters: [],
		transitions: []
	};

	ShowAction.prototype._run = function (fsm) {
		var entity = fsm.getOwnerEntity();
		entity.show();
	};

	module.exports = ShowAction;
sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"escalations/test/integration/pages/EscalationsList.gen",
	"escalations/test/integration/pages/EscalationsObjectPage.gen",
	"escalations/test/integration/pages/ActionsObjectPage.gen"
], function (JourneyRunner, EscalationsListGenerated, EscalationsObjectPageGenerated, ActionsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('escalations') + '/test/flp.html#app-preview',
        pages: {
			onTheEscalationsListGenerated: EscalationsListGenerated,
			onTheEscalationsObjectPageGenerated: EscalationsObjectPageGenerated,
			onTheActionsObjectPageGenerated: ActionsObjectPageGenerated
        },
        async: true
    });

    return runner;
});


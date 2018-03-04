angular = window.angular;

document.onreadystatechange = function () {
    if (document.readyState === 'interactive') {
        angular.module('CSSRedesign.common').run(function (billingPolicyRepository) {
            billingPolicyRepository.policySummaryRequest = function () {
                console.log('fake summary1');
                return Promise.resolve({})
            };
        });
    }
};
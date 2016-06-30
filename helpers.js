'use strict';

var Helpers = module.exports;

Helpers.reduceFraction = function reduceFraction(numerator, denominator) {
  var gcd = function gcd(a,b) {
    return b ? gcd(b, a%b) : a;
  };

  gcd = gcd(numerator,denominator);
  return [numerator/gcd, denominator/gcd];
}

Helpers.formatUptime = function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}

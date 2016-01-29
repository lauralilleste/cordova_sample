#!/usr/bin/env node

var CI = process.env.CI;
if (typeof CI === 'undefined') {
    console.log("Not a CI build, will not bump version");
    return
} else {
    console.log("CI build, will bump version");
}

var BUILD_NUMBER = process.env.GREENHOUSE_BUILD_NUMBER;

module.exports = function(context) {
    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        ConfigParser = context.requireCordovaModule('cordova-lib').configparser,
        cfg = new ConfigParser(path.join(context.opts.projectRoot, 'config.xml'));

    function getProjectFile(platform) {
        var platformPath = path.join(context.opts.projectRoot, 'platforms', platform);
        if (platform === 'android') {
            return path.join(platformPath, 'AndroidManifest.xml');
        } else if (platform === 'ios') {
            return path.join(platformPath, cfg.name() + "-Info.plist")
        }
    }

    var updateIOSCFBundleVersion = function() {
        var plist = getProjectFile("ios", cfg.name() + "-Info.plist");
        var shell = require(path.join(context.opts.projectRoot, "platforms/ios/cordova/node_modules/shelljs"));
        shell.exec("/usr/libexec/PlistBuddy -c \"Set :CFBundleVersion " + timestamp + "\" \"" + plist + "\"");
    };

    var updateAndroidVersionCode = function() {
        var manifestPath = getProjectFile("android", "AndroidManifest.xml");
        var data = fs.readFileSync(manifestPath, "utf8");

        var version_code = "android:versionCode=\"" + BUILD_NUMBER + "\"";
        var replaceRegex = new RegExp("android:versionCode=\"[0-9^\"]*\"", "g");
        var result = data.replace(replaceRegex, version_code);
        fs.writeFileSync(manifestPath, result, "utf8");
    };

    context.opts.platforms.forEach(function(platform) {
        //if (platform === "ios") {
        //    updateIOSCFBundleVersion();
        //} else
        if (platform === "android") {
            updateAndroidVersionCode();
        }
    });

    //var deferral = context.requireCordovaModule('q').defer();
    //return deferral.promise;
};


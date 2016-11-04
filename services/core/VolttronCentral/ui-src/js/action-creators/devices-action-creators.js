'use strict';

var ACTION_TYPES = require('../constants/action-types');
var authorizationStore = require('../stores/authorization-store');
var dispatcher = require('../dispatcher');
var rpc = require('../lib/rpc');

var statusIndicatorActionCreators = require('../action-creators/status-indicator-action-creators');

var devicesActionCreators = {
    configureDevices: function (platform) {
        dispatcher.dispatch({
            type: ACTION_TYPES.CONFIGURE_DEVICES,
            platform: platform
        });
    },
    addDevices: function (platform) {
        dispatcher.dispatch({
            type: ACTION_TYPES.ADD_DEVICES,
            platform: platform
        });
    },
    scanForDevices: function (platformUuid, platformAgentUuid, bacnetProxyIdentity, low, high, address) {

        var authorization = authorizationStore.getAuthorization();

        var params = {
            proxy_identity: bacnetProxyIdentity
        };

        if (low)
        {
            params.low_device_id = Number(low);
        }

        if (high)
        {
            params.high_device_id = Number(high);
        }

        if (address)
        {
            params.target_address = address;
        }

        return new rpc.Exchange({
            method: 'platform.uuid.' + platformUuid + '.agent.uuid.' + platformAgentUuid + '.start_bacnet_scan',
            authorization: authorization,
            params: params,
        }).promise
            .then(function (result) {
                dispatcher.dispatch({
                    type: ACTION_TYPES.LISTEN_FOR_IAMS,
                    platformUuid: platformUuid,
                    bacnetProxyIdentity: bacnetProxyIdentity,
                    low_device_id: low,
                    high_device_id: high,
                    target_address: address
                });                
            })
            .catch(rpc.Error, function (error) {

                error.message = "Unable to scan for devices. " + error.message + ".";

                handle401(error, error.message);
            });
        
    },
    deviceDetected: function (device, platform, bacnet) {
        dispatcher.dispatch({
            type: ACTION_TYPES.DEVICE_DETECTED,
            platform: platform,
            bacnet: bacnet,
            device: device
        });
    },
    pointReceived: function (data, platform) {
        dispatcher.dispatch({
            type: ACTION_TYPES.POINT_RECEIVED,
            platform: platform,
            data: data
        });
    },
    cancelScan: function (platform) {
        dispatcher.dispatch({
            type: ACTION_TYPES.CANCEL_SCANNING,
            platform: platform
        });
    },
    handleKeyDown: function (keydown) {
        dispatcher.dispatch({
            type: ACTION_TYPES.HANDLE_KEY_DOWN,
            keydown: keydown
        });
    },
    focusOnDevice: function (deviceId, address) {
        dispatcher.dispatch({
            type: ACTION_TYPES.FOCUS_ON_DEVICE,
            deviceId: deviceId,
            address: address
        });

        console.log("focused on device");
    },
    // listDetectedDevices: function (platform) {
    //     dispatcher.dispatch({
    //         type: ACTION_TYPES.LIST_DETECTED_DEVICES,
    //         platform: platform
    //     });
    // },
    configureDevice: function (device, bacnetIdentity, platformAgentUuid) {
        
        var authorization = authorizationStore.getAuthorization();

        var params = {
            // expanded:false, 
            // "filter":[3000124], 
            device_id: Number(device.id), 
            proxy_identity: bacnetIdentity, 
            address: device.address
        }

        return new rpc.Exchange({
            method: 'platform.uuid.' + device.platformUuid + '.agent.uuid.' + platformAgentUuid + '.publish_bacnet_props',
            authorization: authorization,
            params: params,
        }).promise
            .then(function (result) {

                dispatcher.dispatch({
                    type: ACTION_TYPES.CONFIGURE_DEVICE,
                    device: device
                });
            })
            .catch(rpc.Error, function (error) {

                error.message = "Unable to receive points. " + error.message + ".";

                handle401(error, error.message);
            });
    },
    toggleShowPoints: function (device) {
        dispatcher.dispatch({
            type: ACTION_TYPES.TOGGLE_SHOW_POINTS,
            device: device
        });
    },
    // configureRegistry: function (device) {
    //     dispatcher.dispatch({
    //         type: ACTION_TYPES.CONFIGURE_REGISTRY,
    //         device: device
    //     });
    // },
    // generateRegistry: function (device) {
    //     dispatcher.dispatch({
    //         type: ACTION_TYPES.GENERATE_REGISTRY,
    //         device: device
    //     });
    // },
    cancelRegistry: function (device) {
        dispatcher.dispatch({
            type: ACTION_TYPES.CANCEL_REGISTRY,
            device: device
        });
    },
    loadRegistry: function (deviceId, deviceAddress, csvData, fileName) {
        dispatcher.dispatch({
            type: ACTION_TYPES.LOAD_REGISTRY,
            deviceId: deviceId,
            deviceAddress: deviceAddress,
            data: csvData.filter(function (row) {
                return row.length > 0;
            }),
            file: fileName
        });
    },
    editRegistry: function (device) {
        dispatcher.dispatch({
            type: ACTION_TYPES.EDIT_REGISTRY,
            device: device
        });
    },
    updateRegistry: function (deviceId, deviceAddress, selectedPoints, attributes) {
        dispatcher.dispatch({
            type: ACTION_TYPES.UPDATE_REGISTRY,
            deviceId: deviceId,
            deviceAddress: deviceAddress,
            selectedPoints: selectedPoints,
            attributes: attributes
        });
    },
    saveRegistry: function (deviceId, deviceAddress, values) {
        dispatcher.dispatch({
            type: ACTION_TYPES.SAVE_REGISTRY,
            deviceId: deviceId,
            deviceAddress: deviceAddress,
            data: values
        });
    },
    saveConfig: function (device, settings) {
        dispatcher.dispatch({
            type: ACTION_TYPES.SAVE_CONFIG,
            device: device,
            settings: settings
        });
    },
};

function handle401(error, message, highlight, orientation) {
   if ((error.code && error.code === 401) || (error.response && error.response.status === 401)) {
        dispatcher.dispatch({
            type: ACTION_TYPES.RECEIVE_UNAUTHORIZED,
            error: error,
        });

        platformManagerActionCreators.clearAuthorization();
    }
    else if (message)
    {
        statusIndicatorActionCreators.openStatusIndicator("error", message, highlight, orientation);
    }
}

module.exports = devicesActionCreators;
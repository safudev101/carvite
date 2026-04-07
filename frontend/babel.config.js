module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // Agar aap Expo Router ya Reanimated use kar rahe hain to plugins yahan aayenge
            'react-native-reanimated/plugin',
        ],
    };
};
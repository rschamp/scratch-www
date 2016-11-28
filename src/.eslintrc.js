module.exports = {
    root: true,
    extends: ['scratch', 'scratch/react'],
    rules: {
        'react/prop-types': [2, {
            ignore: ['intl']
        }]
    },
    env: {
        browser: true
    },
    plugins: ['json']
};

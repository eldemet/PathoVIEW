import utilitiesNode from 'utilities-node/eslint.config.js';

export default [
    ...utilitiesNode,
    {
        ignores: [
            '*.ts'
        ],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 'latest'
            }
        }
    }
];

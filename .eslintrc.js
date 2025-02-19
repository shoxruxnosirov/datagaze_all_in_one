module.exports = {
    parser: '@typescript-eslint/parser', // TypeScript kodini tahlil qilish uchun
    parserOptions: {
      project: 'tsconfig.json', // TypeScript konfiguratsiyasiga havola
      sourceType: 'module', // ES modullaridan foydalanish
    },
    plugins: ['@typescript-eslint/eslint-plugin'], // TypeScript qoidalari uchun
    extends: [
      'plugin:@typescript-eslint/recommended', // TypeScript uchun tavsiya etilgan qoidalar
      'plugin:prettier/recommended', // Prettier bilan integratsiya
    ],
    root: true, // Loyiha ildizida ESLint ishlatilishini belgilash
    env: {
      node: true, // Node.js muhiti
      jest: true, // Jest test muhiti
    },
    ignorePatterns: ['.eslintrc.js'], // ESLint konfiguratsiya faylini tekshirishdan chetda qoldirish
    rules: {
      // Qo'shimcha qoidalar
      '@typescript-eslint/interface-name-prefix': 'off', // Interfeys nomlarida prefiks talab qilmaslik
      '@typescript-eslint/explicit-function-return-type': 'off', // Funktsiya qaytaruvchi tipini majburiy qilmaslik
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Modul chegaralarida tipni majburiy qilmaslik
      '@typescript-eslint/no-explicit-any': 'off', // `any` tipidan foydalanishga ruxsat berish
      'no-console': 'warn', // Konsolga chiqarishni ogohlantirish
    },
  };
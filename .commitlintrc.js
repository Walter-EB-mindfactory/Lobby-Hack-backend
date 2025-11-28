module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Corrección de bugs
        'docs',     // Documentación
        'style',    // Formato, puntos y comas, etc
        'refactor', // Refactorización
        'perf',     // Mejora de rendimiento
        'test',     // Tests
        'chore',    // Mantenimiento
        'ci',       // CI/CD
        'build',    // Build
        'revert',   // Revert
      ],
    ],
    'subject-case': [0],
  },
};

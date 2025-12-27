import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppLanguage = 'nl' | 'en' | 'fr' | 'es';

interface Translations {
  // Navigation
  nav_learn: string;
  nav_quiz: string;
  nav_add: string;
  nav_test: string;
  nav_statistics: string;
  nav_learn_words: string;
  nav_learn_conjugations: string;
  nav_quiz_words: string;
  nav_quiz_conjugations: string;
  nav_add_word: string;
  nav_suggest_words: string;
  nav_import_words: string;
  nav_add_conjugation: string;
  nav_import_conjugations: string;
  nav_request_conjugation: string;
  nav_admin: string;
  
  // Common
  common_loading: string;
  common_error: string;
  common_save: string;
  common_cancel: string;
  common_delete: string;
  common_edit: string;
  common_add: string;
  common_search: string;
  common_filter: string;
  common_all: string;
  common_none: string;
  common_yes: string;
  common_no: string;
  common_next: string;
  common_previous: string;
  common_show: string;
  common_hide: string;
  common_translate: string;
  common_word: string;
  common_translation: string;
  common_word_type: string;
  common_source_language: string;
  common_target_language: string;
  common_select_language: string;
  common_logout: string;
  
  // Learn mode
  learn_title: string;
  learn_no_words: string;
  learn_show_translation: string;
  learn_hide_translation: string;
  learn_shuffle: string;
  learn_learned: string;
  learn_progress: string;
  learn_filter_all: string;
  learn_filter_learned: string;
  learn_filter_not_learned: string;
  learn_min_niveau: string;
  
  // Quiz mode
  quiz_title: string;
  quiz_start: string;
  quiz_check: string;
  quiz_correct: string;
  quiz_incorrect: string;
  quiz_your_answer: string;
  quiz_no_words: string;
  quiz_complete: string;
  quiz_score: string;
  quiz_restart: string;
  quiz_question_count: string;
  quiz_ignore_accents: string;
  
  // Add word
  add_word_title: string;
  add_word_placeholder: string;
  add_word_success: string;
  add_word_error: string;
  add_word_existing: string;
  add_word_confirm: string;
  
  // Suggest words
  suggest_title: string;
  suggest_category: string;
  suggest_category_placeholder: string;
  suggest_count: string;
  suggest_get: string;
  suggest_select_all: string;
  suggest_select_none: string;
  suggest_add_selected: string;
  suggest_no_suggestions: string;
  
  // Statistics
  stats_title: string;
  stats_total_words: string;
  stats_learned: string;
  stats_not_learned: string;
  stats_quiz_attempts: string;
  stats_incorrect: string;
  stats_per_niveau: string;
  
  // Auth
  auth_login: string;
  auth_register: string;
  auth_email: string;
  auth_password: string;
  auth_login_button: string;
  auth_register_button: string;
  auth_no_account: string;
  auth_has_account: string;
}

const translations: Record<AppLanguage, Translations> = {
  nl: {
    nav_learn: 'Leren',
    nav_quiz: 'Toetsen',
    nav_add: 'Toevoegen',
    nav_test: 'Toetsen',
    nav_statistics: 'Statistieken',
    nav_learn_words: 'Woorden',
    nav_learn_conjugations: 'Vervoegingen',
    nav_quiz_words: 'Woorden',
    nav_quiz_conjugations: 'Vervoegingen',
    nav_add_word: 'Woord',
    nav_suggest_words: 'Suggesties',
    nav_import_words: 'Woorden importeren',
    nav_add_conjugation: 'Vervoeging',
    nav_import_conjugations: 'Vervoegingen importeren',
    nav_request_conjugation: 'Aanvragen',
    nav_admin: 'Admin',
    common_loading: 'Laden...',
    common_error: 'Er is een fout opgetreden',
    common_save: 'Opslaan',
    common_cancel: 'Annuleren',
    common_delete: 'Verwijderen',
    common_edit: 'Bewerken',
    common_add: 'Toevoegen',
    common_search: 'Zoeken',
    common_filter: 'Filter',
    common_all: 'Alle',
    common_none: 'Geen',
    common_yes: 'Ja',
    common_no: 'Nee',
    common_next: 'Volgende',
    common_previous: 'Vorige',
    common_show: 'Tonen',
    common_hide: 'Verbergen',
    common_translate: 'Vertaal',
    common_word: 'Woord',
    common_translation: 'Vertaling',
    common_word_type: 'Woordsoort',
    common_source_language: 'Brontaal',
    common_target_language: 'Doeltaal',
    common_select_language: 'Selecteer taal',
    common_logout: 'Uitloggen',
    learn_title: 'Woorden leren',
    learn_no_words: 'Geen woorden gevonden',
    learn_show_translation: 'Toon vertaling',
    learn_hide_translation: 'Verberg vertaling',
    learn_shuffle: 'Shuffle',
    learn_learned: 'Geleerd',
    learn_progress: 'Voortgang',
    learn_filter_all: 'Alle woorden',
    learn_filter_learned: 'Geleerd',
    learn_filter_not_learned: 'Niet geleerd',
    learn_min_niveau: 'Minimum niveau',
    quiz_title: 'Woorden toetsen',
    quiz_start: 'Start toets',
    quiz_check: 'Controleer',
    quiz_correct: 'Correct!',
    quiz_incorrect: 'Fout',
    quiz_your_answer: 'Jouw antwoord',
    quiz_no_words: 'Geen woorden beschikbaar voor de toets',
    quiz_complete: 'Toets voltooid!',
    quiz_score: 'Score',
    quiz_restart: 'Opnieuw',
    quiz_question_count: 'Aantal vragen',
    quiz_ignore_accents: 'Leestekens negeren',
    add_word_title: 'Woord toevoegen',
    add_word_placeholder: 'Voer een woord in',
    add_word_success: 'Woord toegevoegd!',
    add_word_error: 'Fout bij toevoegen',
    add_word_existing: 'Dit woord bestaat al',
    add_word_confirm: 'Bevestig',
    suggest_title: 'Woorden voorstellen',
    suggest_category: 'Categorie',
    suggest_category_placeholder: 'bijv. eten, reizen, werk',
    suggest_count: 'Aantal',
    suggest_get: 'Suggesties ophalen',
    suggest_select_all: 'Alles selecteren',
    suggest_select_none: 'Niets selecteren',
    suggest_add_selected: 'Geselecteerde toevoegen',
    suggest_no_suggestions: 'Geen suggesties gevonden',
    stats_title: 'Statistieken',
    stats_total_words: 'Totaal woorden',
    stats_learned: 'Geleerd',
    stats_not_learned: 'Niet geleerd',
    stats_quiz_attempts: 'Toets pogingen',
    stats_incorrect: 'Moeilijke woorden',
    stats_per_niveau: 'Statistieken per niveau',
    auth_login: 'Inloggen',
    auth_register: 'Registreren',
    auth_email: 'E-mail',
    auth_password: 'Wachtwoord',
    auth_login_button: 'Inloggen',
    auth_register_button: 'Registreren',
    auth_no_account: 'Nog geen account?',
    auth_has_account: 'Al een account?',
  },
  en: {
    nav_learn: 'Learn',
    nav_quiz: 'Quiz',
    nav_add: 'Add',
    nav_test: 'Test',
    nav_statistics: 'Statistics',
    nav_learn_words: 'Words',
    nav_learn_conjugations: 'Conjugations',
    nav_quiz_words: 'Words',
    nav_quiz_conjugations: 'Conjugations',
    nav_add_word: 'Word',
    nav_suggest_words: 'Suggestions',
    nav_import_words: 'Import Words',
    nav_add_conjugation: 'Conjugation',
    nav_import_conjugations: 'Import Conjugations',
    nav_request_conjugation: 'Request',
    nav_admin: 'Admin',
    common_loading: 'Loading...',
    common_error: 'An error occurred',
    common_save: 'Save',
    common_cancel: 'Cancel',
    common_delete: 'Delete',
    common_edit: 'Edit',
    common_add: 'Add',
    common_search: 'Search',
    common_filter: 'Filter',
    common_all: 'All',
    common_none: 'None',
    common_yes: 'Yes',
    common_no: 'No',
    common_next: 'Next',
    common_previous: 'Previous',
    common_show: 'Show',
    common_hide: 'Hide',
    common_translate: 'Translate',
    common_word: 'Word',
    common_translation: 'Translation',
    common_word_type: 'Word type',
    common_source_language: 'Source language',
    common_target_language: 'Target language',
    common_select_language: 'Select language',
    common_logout: 'Logout',
    learn_title: 'Learn words',
    learn_no_words: 'No words found',
    learn_show_translation: 'Show translation',
    learn_hide_translation: 'Hide translation',
    learn_shuffle: 'Shuffle',
    learn_learned: 'Learned',
    learn_progress: 'Progress',
    learn_filter_all: 'All words',
    learn_filter_learned: 'Learned',
    learn_filter_not_learned: 'Not learned',
    learn_min_niveau: 'Minimum level',
    quiz_title: 'Quiz words',
    quiz_start: 'Start quiz',
    quiz_check: 'Check',
    quiz_correct: 'Correct!',
    quiz_incorrect: 'Wrong',
    quiz_your_answer: 'Your answer',
    quiz_no_words: 'No words available for the quiz',
    quiz_complete: 'Quiz complete!',
    quiz_score: 'Score',
    quiz_restart: 'Restart',
    quiz_question_count: 'Number of questions',
    quiz_ignore_accents: 'Ignore accents',
    add_word_title: 'Add word',
    add_word_placeholder: 'Enter a word',
    add_word_success: 'Word added!',
    add_word_error: 'Error adding word',
    add_word_existing: 'This word already exists',
    add_word_confirm: 'Confirm',
    suggest_title: 'Suggest words',
    suggest_category: 'Category',
    suggest_category_placeholder: 'e.g. food, travel, work',
    suggest_count: 'Count',
    suggest_get: 'Get suggestions',
    suggest_select_all: 'Select all',
    suggest_select_none: 'Select none',
    suggest_add_selected: 'Add selected',
    suggest_no_suggestions: 'No suggestions found',
    stats_title: 'Statistics',
    stats_total_words: 'Total words',
    stats_learned: 'Learned',
    stats_not_learned: 'Not learned',
    stats_quiz_attempts: 'Quiz attempts',
    stats_incorrect: 'Difficult words',
    stats_per_niveau: 'Statistics per level',
    auth_login: 'Login',
    auth_register: 'Register',
    auth_email: 'Email',
    auth_password: 'Password',
    auth_login_button: 'Login',
    auth_register_button: 'Register',
    auth_no_account: "Don't have an account?",
    auth_has_account: 'Already have an account?',
  },
  fr: {
    nav_learn: 'Apprendre',
    nav_quiz: 'Quiz',
    nav_add: 'Ajouter',
    nav_test: 'Tester',
    nav_statistics: 'Statistiques',
    nav_learn_words: 'Mots',
    nav_learn_conjugations: 'Conjugaisons',
    nav_quiz_words: 'Mots',
    nav_quiz_conjugations: 'Conjugaisons',
    nav_add_word: 'Mot',
    nav_suggest_words: 'Suggestions',
    nav_import_words: 'Importer mots',
    nav_add_conjugation: 'Conjugaison',
    nav_import_conjugations: 'Importer conjugaisons',
    nav_request_conjugation: 'Demander',
    nav_admin: 'Admin',
    common_loading: 'Chargement...',
    common_error: 'Une erreur est survenue',
    common_save: 'Enregistrer',
    common_cancel: 'Annuler',
    common_delete: 'Supprimer',
    common_edit: 'Modifier',
    common_add: 'Ajouter',
    common_search: 'Rechercher',
    common_filter: 'Filtrer',
    common_all: 'Tous',
    common_none: 'Aucun',
    common_yes: 'Oui',
    common_no: 'Non',
    common_next: 'Suivant',
    common_previous: 'Précédent',
    common_show: 'Afficher',
    common_hide: 'Masquer',
    common_translate: 'Traduire',
    common_word: 'Mot',
    common_translation: 'Traduction',
    common_word_type: 'Type de mot',
    common_source_language: 'Langue source',
    common_target_language: 'Langue cible',
    common_select_language: 'Sélectionner la langue',
    common_logout: 'Déconnexion',
    learn_title: 'Apprendre les mots',
    learn_no_words: 'Aucun mot trouvé',
    learn_show_translation: 'Afficher la traduction',
    learn_hide_translation: 'Masquer la traduction',
    learn_shuffle: 'Mélanger',
    learn_learned: 'Appris',
    learn_progress: 'Progression',
    learn_filter_all: 'Tous les mots',
    learn_filter_learned: 'Appris',
    learn_filter_not_learned: 'Non appris',
    learn_min_niveau: 'Niveau minimum',
    quiz_title: 'Quiz de mots',
    quiz_start: 'Commencer le quiz',
    quiz_check: 'Vérifier',
    quiz_correct: 'Correct !',
    quiz_incorrect: 'Faux',
    quiz_your_answer: 'Votre réponse',
    quiz_no_words: 'Aucun mot disponible pour le quiz',
    quiz_complete: 'Quiz terminé !',
    quiz_score: 'Score',
    quiz_restart: 'Recommencer',
    quiz_question_count: 'Nombre de questions',
    quiz_ignore_accents: 'Ignorer les accents',
    add_word_title: 'Ajouter un mot',
    add_word_placeholder: 'Entrez un mot',
    add_word_success: 'Mot ajouté !',
    add_word_error: "Erreur lors de l'ajout",
    add_word_existing: 'Ce mot existe déjà',
    add_word_confirm: 'Confirmer',
    suggest_title: 'Suggérer des mots',
    suggest_category: 'Catégorie',
    suggest_category_placeholder: 'ex. nourriture, voyage, travail',
    suggest_count: 'Nombre',
    suggest_get: 'Obtenir des suggestions',
    suggest_select_all: 'Tout sélectionner',
    suggest_select_none: 'Tout désélectionner',
    suggest_add_selected: 'Ajouter la sélection',
    suggest_no_suggestions: 'Aucune suggestion trouvée',
    stats_title: 'Statistiques',
    stats_total_words: 'Total des mots',
    stats_learned: 'Appris',
    stats_not_learned: 'Non appris',
    stats_quiz_attempts: 'Tentatives de quiz',
    stats_incorrect: 'Mots difficiles',
    stats_per_niveau: 'Statistiques par niveau',
    auth_login: 'Connexion',
    auth_register: 'Inscription',
    auth_email: 'E-mail',
    auth_password: 'Mot de passe',
    auth_login_button: 'Se connecter',
    auth_register_button: "S'inscrire",
    auth_no_account: "Pas encore de compte ?",
    auth_has_account: 'Déjà un compte ?',
  },
  es: {
    nav_learn: 'Aprender',
    nav_quiz: 'Prueba',
    nav_add: 'Añadir',
    nav_test: 'Probar',
    nav_statistics: 'Estadísticas',
    nav_learn_words: 'Palabras',
    nav_learn_conjugations: 'Conjugaciones',
    nav_quiz_words: 'Palabras',
    nav_quiz_conjugations: 'Conjugaciones',
    nav_add_word: 'Palabra',
    nav_suggest_words: 'Sugerencias',
    nav_import_words: 'Importar palabras',
    nav_add_conjugation: 'Conjugación',
    nav_import_conjugations: 'Importar conjugaciones',
    nav_request_conjugation: 'Solicitar',
    nav_admin: 'Admin',
    common_loading: 'Cargando...',
    common_error: 'Ha ocurrido un error',
    common_save: 'Guardar',
    common_cancel: 'Cancelar',
    common_delete: 'Eliminar',
    common_edit: 'Editar',
    common_add: 'Añadir',
    common_search: 'Buscar',
    common_filter: 'Filtrar',
    common_all: 'Todos',
    common_none: 'Ninguno',
    common_yes: 'Sí',
    common_no: 'No',
    common_next: 'Siguiente',
    common_previous: 'Anterior',
    common_show: 'Mostrar',
    common_hide: 'Ocultar',
    common_translate: 'Traducir',
    common_word: 'Palabra',
    common_translation: 'Traducción',
    common_word_type: 'Tipo de palabra',
    common_source_language: 'Idioma de origen',
    common_target_language: 'Idioma de destino',
    common_select_language: 'Seleccionar idioma',
    common_logout: 'Cerrar sesión',
    learn_title: 'Aprender palabras',
    learn_no_words: 'No se encontraron palabras',
    learn_show_translation: 'Mostrar traducción',
    learn_hide_translation: 'Ocultar traducción',
    learn_shuffle: 'Mezclar',
    learn_learned: 'Aprendido',
    learn_progress: 'Progreso',
    learn_filter_all: 'Todas las palabras',
    learn_filter_learned: 'Aprendidas',
    learn_filter_not_learned: 'No aprendidas',
    learn_min_niveau: 'Nivel mínimo',
    quiz_title: 'Prueba de palabras',
    quiz_start: 'Iniciar prueba',
    quiz_check: 'Comprobar',
    quiz_correct: '¡Correcto!',
    quiz_incorrect: 'Incorrecto',
    quiz_your_answer: 'Tu respuesta',
    quiz_no_words: 'No hay palabras disponibles para la prueba',
    quiz_complete: '¡Prueba completada!',
    quiz_score: 'Puntuación',
    quiz_restart: 'Reiniciar',
    quiz_question_count: 'Número de preguntas',
    quiz_ignore_accents: 'Ignorar acentos',
    add_word_title: 'Añadir palabra',
    add_word_placeholder: 'Introduce una palabra',
    add_word_success: '¡Palabra añadida!',
    add_word_error: 'Error al añadir',
    add_word_existing: 'Esta palabra ya existe',
    add_word_confirm: 'Confirmar',
    suggest_title: 'Sugerir palabras',
    suggest_category: 'Categoría',
    suggest_category_placeholder: 'ej. comida, viajes, trabajo',
    suggest_count: 'Cantidad',
    suggest_get: 'Obtener sugerencias',
    suggest_select_all: 'Seleccionar todo',
    suggest_select_none: 'Deseleccionar todo',
    suggest_add_selected: 'Añadir seleccionados',
    suggest_no_suggestions: 'No se encontraron sugerencias',
    stats_title: 'Estadísticas',
    stats_total_words: 'Total de palabras',
    stats_learned: 'Aprendidas',
    stats_not_learned: 'No aprendidas',
    stats_quiz_attempts: 'Intentos de prueba',
    stats_incorrect: 'Palabras difíciles',
    stats_per_niveau: 'Estadísticas por nivel',
    auth_login: 'Iniciar sesión',
    auth_register: 'Registrarse',
    auth_email: 'Correo electrónico',
    auth_password: 'Contraseña',
    auth_login_button: 'Iniciar sesión',
    auth_register_button: 'Registrarse',
    auth_no_account: '¿No tienes cuenta?',
    auth_has_account: '¿Ya tienes cuenta?',
  },
};

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['nl', 'en', 'fr', 'es'].includes(stored)) {
      return stored as AppLanguage;
    }
    return 'nl';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

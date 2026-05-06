// src/constants/storage.js

// Ключ для хранения данных в localStorage
export const STORAGE_KEY = 'checkvoice_data';

// Текущая версия формата данных
export const STORAGE_VERSION = 2;

// Порог заполнения для предупреждения (80%)
export const STORAGE_WARNING_PERCENT = 80;

// Порог заполнения для критического состояния (95%)
export const STORAGE_CRITICAL_PERCENT = 95;

// Максимальный размер хранилища в байтах (5 МБ)
export const STORAGE_MAX_BYTES = 5 * 1024 * 1024;
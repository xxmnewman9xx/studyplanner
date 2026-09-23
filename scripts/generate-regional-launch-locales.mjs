#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import OpenCC from "opencc-js/cn2t";

const path = new URL("../localized-app-strings/core-launch-strings.json", import.meta.url);
const catalog = JSON.parse(readFileSync(path, "utf8"));
const toTaiwan = OpenCC.Converter({ from: "cn", to: "tw" });

const ptOverrides = {
  brand_subtitle: "IA para programas",
  "common.back": "Voltar",
  "common.continue": "Continuar",
  "tabs.classes": "Disciplinas",
  "tabs.scan": "Importar",
  "tabs.plan": "Plano",
  "tabs.widgets": "Widgets",
  "today.add_class": "Adicionar disciplina",
  "today.scan_syllabus": "Digitalizar programa",
  "onboarding.preview_method_upload_pdf": "Carregar PDF",
  "onboarding.preview_method_paste_text": "Colar texto",
  "onboarding.preview_home_screen": "Ecrã principal",
  "import.upload_pdf": "Carregar PDF",
  "import.camera": "Câmara",
  "import.choose_photo": "Escolher fotografia",
  "import.pdf_title": "Carrega um PDF do programa.",
  "import.paste_placeholder": "Cola linhas do programa ou datas...",
  "widgets.home_screen": "Ecrã principal",
  "widgets.language_detail": "Região atual: {locale}",
  "widget_snapshot.class": "Disciplina",
  "widget_snapshot.all_classes": "Todas as disciplinas",
  "assignment_detail.course": "Disciplina",
  "assignment_detail.class_fallback": "Disciplina",
};

function europeanPortuguese(text) {
  return [
    ["Gerenciar", "Gerir"], ["gerenciar", "gerir"],
    ["Salvar", "Guardar"], ["salvar", "guardar"],
    ["Excluir", "Eliminar"], ["excluir", "eliminar"],
    ["Tela de Início", "Ecrã principal"], ["tela inicial", "ecrã principal"], ["Tela inicial", "Ecrã principal"],
    ["Arquivos", "Ficheiros"], ["arquivos", "ficheiros"], ["Arquivo", "Ficheiro"], ["arquivo", "ficheiro"],
    ["planejador", "planeador"], ["celular", "telemóvel"], ["Câmera", "Câmara"], ["câmera", "câmara"],
  ].reduce((value, [from, to]) => value.split(from).join(to), text);
}

function transform(value, convert) {
  if (typeof value === "string") return convert(value);
  if (Array.isArray(value)) return value.map((item) => transform(item, convert));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, transform(item, convert)]));
}

function setAtPath(target, keyPath, value) {
  const parts = keyPath.split(".");
  const leaf = parts.pop();
  let current = target;
  for (const part of parts) current = current[part] ||= {};
  current[leaf] = value;
}

catalog["pt-PT"] = transform(catalog["pt-BR"], europeanPortuguese);
for (const [key, value] of Object.entries(ptOverrides)) setAtPath(catalog["pt-PT"], key, value);
catalog["zh-Hant"] = transform(catalog["zh-Hans"], toTaiwan);
catalog["pt-PT"].direction = "ltr";
catalog["zh-Hant"].direction = "ltr";

writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`);
console.log("Generated pt-PT and zh-Hant launch catalogs.");

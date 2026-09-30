-- Contas só para maiores de 18 anos: guarda quando a pessoa confirmou a idade
-- e qual versão dos Termos aceitou. A data de nascimento em si nunca é guardada.
ALTER TABLE profiles ADD COLUMN adult_confirmed_at TEXT;
ALTER TABLE profiles ADD COLUMN terms_version TEXT;
ALTER TABLE profiles ADD COLUMN terms_accepted_at TEXT;

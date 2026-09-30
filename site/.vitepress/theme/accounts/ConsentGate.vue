<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { accountsEnabled, api, ApiError } from './api';
import { me, refreshMe, signOut } from './session';

/**
 * Accounts are for people who are 18 or older. The first time someone logs
 * in (and again when the Terms change) this asks for the date of birth and
 * the acceptance of the Terms. The server checks the date and throws it away;
 * someone younger has the new account deleted and keeps reading as a visitor.
 */
const dialog = ref<HTMLDialogElement | null>(null);
const birthDate = ref('');
const accepted = ref(false);
const sending = ref(false);
const error = ref('');
const refusedMessage = ref('');

const open = computed(() => accountsEnabled && Boolean(me.value) && me.value?.consented === false);
const today = new Date().toISOString().slice(0, 10);

watch(
  [open, dialog],
  async ([isOpen, element]) => {
    await nextTick();

    if (isOpen && element && !element.open) {
      element.showModal();
    }
  },
  { immediate: true },
);

async function submit(): Promise<void> {
  error.value = '';

  if (!birthDate.value) {
    error.value = 'Informe a sua data de nascimento.';

    return;
  }

  if (!accepted.value) {
    error.value = 'Para ter uma conta, é preciso aceitar os Termos de Uso.';

    return;
  }

  sending.value = true;

  try {
    await api('/api/me/consent', { json: { birthDate: birthDate.value, acceptTerms: true } });
    await refreshMe();
    dialog.value?.close();
  } catch (failure) {
    if (failure instanceof ApiError && failure.code === 'underage') {
      refusedMessage.value = failure.message;
      await refreshMe();
    } else {
      error.value = failure instanceof ApiError ? failure.message : 'Não foi possível salvar agora.';
    }
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <dialog
    v-if="open || refusedMessage"
    ref="dialog"
    class="consent acct-card"
    aria-labelledby="consent-title"
    @cancel.prevent
  >
    <template v-if="refusedMessage">
      <h2 id="consent-title">Conta não criada</h2>
      <p role="alert">{{ refusedMessage }}</p>
      <a class="acct-btn acct-btn--primary" href="/aprender/">Ver as aulas</a>
    </template>

    <form v-else class="acct-form" novalidate @submit.prevent="submit">
      <h2 id="consent-title">Antes de continuar</h2>
      <p>
        As contas do Aprender são para quem tem <strong>18 anos ou mais</strong>. As aulas continuam abertas para
        todo mundo, sem conta.
      </p>

      <label class="acct-field">
        <span>Data de nascimento</span>
        <input v-model="birthDate" type="date" name="birth-date" autocomplete="bday" :max="today" min="1900-01-01" required />
        <small class="acct-muted">Usamos só para conferir a idade. A data não é guardada.</small>
      </label>

      <label class="acct-check">
        <input v-model="accepted" type="checkbox" required />
        <span>
          Li e aceito os <a href="/termos" target="_blank" rel="noopener">Termos de Uso</a> e a
          <a href="/privacidade" target="_blank" rel="noopener">Política de Privacidade</a>.
        </span>
      </label>

      <p v-if="error" class="acct-error" role="alert">{{ error }}</p>

      <div class="consent__actions">
        <button type="submit" class="acct-btn acct-btn--primary" :disabled="sending">
          {{ sending ? 'Salvando…' : 'Continuar' }}
        </button>
        <button type="button" class="acct-btn" @click="signOut">Sair</button>
      </div>
    </form>
  </dialog>
</template>

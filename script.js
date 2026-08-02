const STORAGE_KEY = 'ruleta-personas-v1';

const initialParticipants = ['Luz', 'Richard', 'Juanes', 'Yuderli', 'Marcela', 'Angel', 'Ricardo', 'Deicy', 'Valentina', 'Ligia', 'Keisy'];

const state = loadState();

const participantSelect = document.getElementById('participantSelect');
const pinInput = document.getElementById('pinInput');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');
const rouletteWheel = document.getElementById('rouletteWheel');
const spinButton = document.getElementById('spinButton');
const exitButton = document.getElementById('exitButton');
const resultMessage = document.getElementById('resultMessage');
const statusMessage = document.getElementById('statusMessage');
const appPanel = document.getElementById('appPanel');
const adminPanel = document.getElementById('adminPanel');
const adminList = document.getElementById('adminList');
const saveAdminButton = document.getElementById('saveAdminButton');
const adminMessage = document.getElementById('adminMessage');
const exportStateButton = document.getElementById('exportStateButton');
const importStateButton = document.getElementById('importStateButton');
const importStateInput = document.getElementById('importStateInput');

loginButton.addEventListener('click', handleLogin);
exitButton.addEventListener('click', handleExit);
saveAdminButton.addEventListener('click', handleAdminSave);
exportStateButton.addEventListener('click', handleExportState);
importStateButton.addEventListener('click', () => importStateInput.click());
importStateInput.addEventListener('change', handleImportFile);
pinInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') handleLogin();
});
spinButton.addEventListener('click', handleSpin);

render();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {
        participants: initialParticipants.map((name) => createParticipant(name)),
        currentUser: null,
      };
    }

    const parsed = JSON.parse(saved);
    return {
      participants: (parsed.participants || initialParticipants.map((name) => createParticipant(name))).map((participant) => ({
        ...createParticipant(participant.name),
        ...participant,
      })),
      currentUser: parsed.currentUser || null,
      currentUserIsAdmin: parsed.currentUserIsAdmin === true,
    };
  } catch (error) {
    console.error('No se pudo leer el estado', error);
    return {
      participants: initialParticipants.map((name) => createParticipant(name)),
      currentUser: null,
      currentUserIsAdmin: false,
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createParticipant(name) {
  return {
    name,
    pin: null,
    hasSpun: false,
    wasChosen: false,
    assignedTarget: null,
    selectedBy: null,
  };
}

function render() {
  renderSelect();
  renderLoginState();
  renderAdminPanel();
}

function renderSelect() {
  participantSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona tu nombre';
  placeholder.disabled = true;
  placeholder.selected = !state.currentUser;
  participantSelect.appendChild(placeholder);

  state.participants.forEach((participant) => {
    const option = document.createElement('option');
    option.value = participant.name;
    option.textContent = participant.name;
    participantSelect.appendChild(option);
  });

  if (state.currentUser) {
    participantSelect.value = state.currentUser;
  }
}

function renderLoginState() {
  if (!state.currentUser) {
    appPanel.classList.remove('visible');
    exitButton.style.display = 'none';
    resultMessage.textContent = '';
    statusMessage.textContent = 'Ingresa tu nombre y crea un PIN para entrar.';
    spinButton.disabled = true;
    rouletteWheel.innerHTML = '<span>Presiona girar</span>';
    return;
  }

  appPanel.classList.add('visible');
  exitButton.style.display = 'block';

  const user = getParticipant(state.currentUser);
  if (!user) {
    state.currentUser = null;
    state.currentUserIsAdmin = false;
    saveState();
    render();
    return;
  }

  if (state.currentUserIsAdmin) {
    spinButton.disabled = true;
    resultMessage.textContent = 'Estás en modo administrador.';
    statusMessage.textContent = 'Revisa las claves y estados de los participantes.';
    rouletteWheel.innerHTML = '<span>Modo admin</span>';
    return;
  }

  if (user.wasChosen) {
    spinButton.disabled = true;
    resultMessage.textContent = `No puedes girar. ${user.selectedBy || 'Alguien'} te eligió.`;
    statusMessage.textContent = 'Puedes volver a entrar solo para ver tu resultado.';
    rouletteWheel.innerHTML = `<span>${user.selectedBy || 'Asignado'}</span>`;
    return;
  }

  if (user.hasSpun) {
    spinButton.disabled = true;
    resultMessage.textContent = `Ya giraste. Te tocó: ${user.assignedTarget}`;
    statusMessage.textContent = 'Ya no puedes volver a girar.';
    rouletteWheel.innerHTML = `<span>${user.assignedTarget}</span>`;
    return;
  }

  spinButton.disabled = false;
  resultMessage.textContent = 'Tu turno está listo. Gira la ruleta.';
  statusMessage.textContent = 'Solo puedes girar una vez.';
  rouletteWheel.innerHTML = '<span>Presiona girar</span>';
}

function handleLogin() {
  const selectedName = participantSelect.value;
  const pin = pinInput.value.trim();

  if (!selectedName) {
    loginMessage.textContent = 'Selecciona tu nombre.';
    return;
  }

  if (selectedName === 'Angel' && pin === '678') {
    state.currentUser = 'Angel';
    state.currentUserIsAdmin = true;
    saveState();
    loginMessage.textContent = 'Acceso administrador concedido. Bienvenido Angel.';
    pinInput.value = '';
    render();
    return;
  }

  const user = getParticipant(selectedName);
  if (!user) {
    loginMessage.textContent = 'Ese nombre no está en la ruleta.';
    return;
  }

  if (!pin) {
    loginMessage.textContent = 'Ingresa tu PIN o crea uno nuevo si es tu primera vez.';
    return;
  }

  if (!user.pin) {
    user.pin = pin;
    state.currentUser = user.name;
    state.currentUserIsAdmin = false;
    saveState();
    loginMessage.textContent = `PIN creado. Bienvenido/a, ${user.name}.`;
    pinInput.value = '';
    render();
    return;
  }

  if (user.pin !== pin) {
    loginMessage.textContent = 'El PIN no es correcto.';
    return;
  }

  state.currentUser = user.name;
  state.currentUserIsAdmin = false;
  saveState();
  loginMessage.textContent = `Bienvenido/a, ${user.name}.`;
  pinInput.value = '';
  render();
}

function handleSpin() {
  const user = getParticipant(state.currentUser);
  if (!user) {
    return;
  }

  if (user.hasSpun || user.wasChosen) {
    renderLoginState();
    return;
  }

  spinButton.disabled = true;
  rouletteWheel.classList.add('spinning');
  rouletteWheel.innerHTML = '<span>Girando...</span>';
  resultMessage.textContent = 'La ruleta está girando...';
  statusMessage.textContent = 'Espera un momento.';

  setTimeout(() => {
    rouletteWheel.classList.remove('spinning');
    const target = chooseTarget(user.name);

    if (!target) {
      resultMessage.textContent = 'No hay participantes disponibles para asignar.';
      statusMessage.textContent = 'Todos ya fueron asignados.';
      rouletteWheel.innerHTML = '<span>Sin opciones</span>';
      return;
    }

    user.hasSpun = true;
    user.assignedTarget = target.name;
    target.wasChosen = true;
    target.selectedBy = user.name;
    saveState();
    render();
    resultMessage.textContent = `¡${user.name} eligió a ${target.name}!`;
    statusMessage.textContent = `${target.name} ya no puede volver a girar y puede ver quién lo eligió.`;
    rouletteWheel.innerHTML = `<span>${target.name}</span>`;
  }, 1800);
}

function chooseTarget(currentUserName) {
  const candidates = state.participants.filter((participant) => {
    return participant.name !== currentUserName && !participant.hasSpun && !participant.wasChosen;
  });

  if (!candidates.length) {
    return null;
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

function handleExit() {
  state.currentUser = null;
  state.currentUserIsAdmin = false;
  loginMessage.textContent = 'Has salido de la ruleta. Selecciona tu nombre para entrar de nuevo.';
  saveState();
  render();
}

function renderAdminPanel() {
  if (!state.currentUserIsAdmin) {
    adminPanel.style.display = 'none';
    adminList.innerHTML = '';
    adminMessage.textContent = '';
    return;
  }

  adminPanel.style.display = 'block';
  renderAdminList();
}

function renderAdminList() {
  const headers = ['Nombre', 'PIN', 'Giro', 'Elegido', 'Por'];
  const rows = state.participants.map((participant) => {
    return `
      <tr>
        <td>${participant.name}</td>
        <td><input class="admin-input admin-pin" data-name="${participant.name}" value="${participant.pin ? participant.pin : ''}" placeholder="PIN"></td>
        <td>
          <select class="admin-select admin-hasSpun" data-name="${participant.name}">
            <option value="false"${participant.hasSpun ? '' : ' selected'}>No</option>
            <option value="true"${participant.hasSpun ? ' selected' : ''}>Sí</option>
          </select>
        </td>
        <td>
          <select class="admin-select admin-wasChosen" data-name="${participant.name}">
            <option value="false"${participant.wasChosen ? '' : ' selected'}>No</option>
            <option value="true"${participant.wasChosen ? ' selected' : ''}>Sí</option>
          </select>
        </td>
        <td><input class="admin-input admin-selectedBy" data-name="${participant.name}" value="${participant.selectedBy ? participant.selectedBy : ''}" placeholder="Nombre"></td>
      </tr>
    `;
  }).join('');

  adminList.innerHTML = `
    <thead>
      <tr>${headers.map((label) => `<th>${label}</th>`).join('')}</tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function handleAdminSave() {
  const pinInputs = document.querySelectorAll('.admin-pin');
  const hasSpunSelects = document.querySelectorAll('.admin-hasSpun');
  const wasChosenSelects = document.querySelectorAll('.admin-wasChosen');
  const selectedByInputs = document.querySelectorAll('.admin-selectedBy');

  pinInputs.forEach((input) => {
    const name = input.dataset.name;
    const participant = getParticipant(name);
    if (participant) {
      participant.pin = input.value.trim() || null;
    }
  });

  hasSpunSelects.forEach((select) => {
    const name = select.dataset.name;
    const participant = getParticipant(name);
    if (participant) {
      participant.hasSpun = select.value === 'true';
    }
  });

  wasChosenSelects.forEach((select) => {
    const name = select.dataset.name;
    const participant = getParticipant(name);
    if (participant) {
      participant.wasChosen = select.value === 'true';
    }
  });

  selectedByInputs.forEach((input) => {
    const name = input.dataset.name;
    const participant = getParticipant(name);
    if (participant) {
      participant.selectedBy = input.value.trim() || null;
    }
  });

  saveState();
  renderAdminList();
  adminMessage.textContent = 'Cambios guardados correctamente.';
}

function handleExportState() {
  if (!state.currentUserIsAdmin) return;
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ruleta-state.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  adminMessage.textContent = 'Archivo descargado.';
}

function handleImportFile(event) {
  if (!state.currentUserIsAdmin) return;
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || !Array.isArray(parsed.participants)) {
        adminMessage.textContent = 'Archivo inválido: formato esperado { participants: [...] }';
        importStateInput.value = '';
        return;
      }

      // Confirm overwrite
      const ok = confirm('Importar el archivo reemplazará el estado actual en este navegador. ¿Continuar?');
      if (!ok) {
        importStateInput.value = '';
        return;
      }

      // Merge participants safely: recreate base structure
      state.participants = parsed.participants.map((p) => ({
        ...createParticipant(p.name || ''),
        ...p,
      }));

      // preserve admin flag only locally
      state.currentUser = null;
      state.currentUserIsAdmin = false;
      saveState();
      render();
      adminMessage.textContent = 'Importación completada.';
    } catch (err) {
      console.error(err);
      adminMessage.textContent = 'Error al leer el archivo JSON.';
    } finally {
      importStateInput.value = '';
    }
  };
  reader.readAsText(file);
}

function getParticipant(name) {
  return state.participants.find((participant) => participant.name.toLowerCase() === name.toLowerCase());
}

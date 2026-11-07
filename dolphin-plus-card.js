class DolphinPlusCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity (vacuum)');
    }
    this._config = {
      name: config.name || 'My Dolphin Plus',
      entity: config.entity,
      ...config
    };
  }

  getCardSize() {
    return 4;
  }

  render() {
    if (!this._hass || !this._config) return;

    const entity = this._hass.states[this._config.entity];
    if (!entity) {
      this.shadowRoot.innerHTML = `<ha-card><div style="padding:16px">Entité introuvable</div></ha-card>`;
      return;
    }

    const state = entity.state || 'unknown';
    const fanMode = entity.attributes.fan_speed || entity.attributes.cleaning_mode || '—';
    const isCleaning = ['cleaning', 'returning'].includes(state);
    const isOn = !['off', 'idle', 'docked', 'unknown', 'unavailable'].includes(state);

    // Tout en brut
    const statusLabel = state;
    const statusColor = this.getStatusColor(state);

    // Modes dynamiques (essaie plusieurs attributs)
    let availableModes = entity.attributes.fan_speed_list 
      || entity.attributes.fan_speeds 
      || entity.attributes.cleaning_modes 
      || [];

    if (!Array.isArray(availableModes)) availableModes = [];

    // Filtre les modes non désirés
    const excluded = ['pickup', 'return', 'home'];
    availableModes = availableModes.filter(m => !excluded.includes(String(m).toLowerCase()));

    const modes = availableModes.length > 0
      ? availableModes.map(m => ({ value: m, label: m }))
      : [{ value: fanMode, label: fanMode }];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
        .card {
          background: linear-gradient(160deg, #0f172a 0%, #1e293b 70%, #0f172a 100%);
          border-radius: 16px;
          padding: 12px 14px;
          color: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          position: relative;
          overflow: hidden;
        }
        .card::after {
          content: '';
          position: absolute;
          bottom: -60px;
          left: -40px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .title {
          font-size: 1.35rem;
          font-weight: 650;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .status-pill {
          background: ${statusColor}22;
          color: ${statusColor};
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          border: 1px solid ${statusColor}55;
        }
        .robot {
          text-align: center;
          margin: 0 0 6px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
          transition: transform 0.4s ease;
        }
        .robot.cleaning { animation: float 2.4s ease-in-out infinite; }
        .zzz {
          position: absolute;
          top: -8px;
          right: 10px;
          font-size: 1.8rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          pointer-events: none;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .info-box {
          background: rgba(30,41,59,0.65);
          border-radius: 12px;
          padding: 8px 12px;
          margin: 6px 0;
          border: 1px solid rgba(71,85,105,0.5);
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
          margin: 4px 0;
        }
        .label { color: #94a3b8; font-weight: 500; }
        .select {
          background: #0f172a;
          color: white;
          border: 1px solid #475569;
          border-radius: 10px;
          padding: 8px 12px;
          width: 100%;
          font-size: 0.95rem;
          margin-top: 6px;
        }
        .controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 10px;
        }
        .btn {
          background: #334155;
          border: none;
          border-radius: 12px;
          padding: 10px;
          color: white;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn:hover { background: #475569; transform: translateY(-1px); }
        .btn.primary { background: #16a34a; }
        .btn.primary:hover { background: #15803d; }
        .btn.danger { background: #dc2626; }
        .btn.danger:hover { background: #b91c1c; }
      </style>

      <ha-card class="card">
        <div class="header">
          <h2 class="title">${this._config.name}</h2>
          <div class="status-pill">${statusLabel}</div>
        </div>

        <div class="robot ${isCleaning ? 'cleaning' : 'stopped'}">
          <svg width="90" height="70" viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
            <!-- Corps principal -->
            <rect x="20" y="25" width="80" height="40" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
            <!-- Chenilles / roues -->
            <rect x="18" y="55" width="18" height="18" rx="4" fill="#475569"/>
            <rect x="84" y="55" width="18" height="18" rx="4" fill="#475569"/>
            <!-- Capot -->
            <rect x="30" y="18" width="60" height="14" rx="6" fill="#334155"/>
            <!-- LED / capteurs -->
            <circle cx="45" cy="40" r="4" fill="#38bdf8"/>
            <circle cx="75" cy="40" r="4" fill="#38bdf8"/>
            <!-- Poignée -->
            <rect x="48" y="12" width="24" height="6" rx="3" fill="#64748b"/>
          </svg>
          ${!isCleaning ? '<div class="zzz">ZZZ</div>' : ''}
        </div>

        <div class="info-box">
          <div class="info-row">
            <span class="label">Mode actuel</span>
            <span>${fanMode}</span>
          </div>
          <div class="info-row">
            <span class="label">État</span>
            <span>${state}</span>
          </div>
        </div>

        <div class="info-box">
          <div class="label">Choisir un mode</div>
          <select class="select" id="mode-select">
            ${modes.map(m => `<option value="${m.value}" ${fanMode === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
          </select>
        </div>

        <div class="controls">
          <button class="btn ${isOn ? 'danger' : 'primary'}" id="power-btn" style="grid-column: span 2;">
            ${isOn ? '⏹ Arrêter' : '▶ Démarrer'}
          </button>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById('power-btn')?.addEventListener('click', () => {
      if (isOn) {
        this._hass.callService('vacuum', 'pause', { entity_id: this._config.entity });
      } else {
        this._hass.callService('vacuum', 'start', { entity_id: this._config.entity });
      }
    });

    const modeSelect = this.shadowRoot.getElementById('mode-select');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this._hass.callService('vacuum', 'set_fan_speed', {
          entity_id: this._config.entity,
          fan_speed: e.target.value
        });
      });
    }
  }

  getStatusColor(state) {
    if (['cleaning', 'returning'].includes(state)) return '#22c55e';
    if (['idle', 'docked', 'paused'].includes(state)) return '#eab308';
    if (state === 'error') return '#ef4444';
    return '#94a3b8';
  }
}

customElements.define('dolphin-plus-card', DolphinPlusCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'dolphin-plus-card',
  name: 'Dolphin Plus Card',
  description: 'Carte dédiée pour MyDolphin Plus'
});

/**
 * Preferences Panel for Auto One-Click Admin
 * IMPORTANT: Must be a React class component (no hooks allowed in Local addons)
 */

import { ADDON_NAME, IPC_CHANNELS } from '../common/constants';

// Get React from global or require
declare const React: any;
const BaseComponent = (typeof React !== 'undefined'
  ? React.Component
  : (require('react') as any).Component) as any;

interface ComponentContext {
  React: typeof React;
  hooks: any;
  electron?: {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  };
}

interface PreferencesPanelProps {
  context: ComponentContext;
  onSettingsChange?: (settings: { enabled: boolean }) => void;
  setApplyButtonDisabled?: (disabled: boolean) => void;
}

interface PreferencesPanelState {
  enabled: boolean;
  loading: boolean;
  error: string | null;
}

export class PreferencesPanel extends BaseComponent {
  props!: PreferencesPanelProps;
  state: PreferencesPanelState;

  constructor(props: PreferencesPanelProps) {
    super(props);
    this.state = {
      enabled: true,
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.loadSettings();
    // Disable Apply button until user makes changes
    if (this.props.setApplyButtonDisabled) {
      this.props.setApplyButtonDisabled(true);
    }
  }

  loadSettings = async () => {
    const { context } = this.props;
    const electron = context.electron || (window as any).electron;

    if (!electron) {
      this.setState({ loading: false, error: 'Electron not available' });
      return;
    }

    try {
      const response = await electron.ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS);

      if (response.success && response.data) {
        this.setState({
          enabled: response.data.enabled,
          loading: false,
        });

        // Notify parent of initial settings
        if (this.props.onSettingsChange) {
          this.props.onSettingsChange({ enabled: response.data.enabled });
        }
      } else {
        this.setState({
          loading: false,
          error: response.error || 'Failed to load settings',
        });
      }
    } catch (error: any) {
      console.error(`[${ADDON_NAME}] Failed to load settings:`, error);
      this.setState({
        loading: false,
        error: error.message,
      });
    }
  };

  handleToggle = (e: any) => {
    const enabled = e.target.checked;

    this.setState({
      enabled,
      error: null,
    });

    // Enable Apply button when changes are made
    if (this.props.setApplyButtonDisabled) {
      this.props.setApplyButtonDisabled(false);
    }

    // Notify parent of changes
    if (this.props.onSettingsChange) {
      this.props.onSettingsChange({ enabled });
    }
  };

  render() {
    const { React } = this.props.context;
    const { enabled, loading, error } = this.state;

    if (loading) {
      return React.createElement('div', {
        style: { padding: '20px', textAlign: 'center' }
      }, 'Loading settings...');
    }

    return React.createElement('div', {
      className: 'oneclick-admin-preferences',
      style: {
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        margin: '20px 0',
      }
    },
      // Header
      React.createElement('h3', {
        style: { marginTop: 0, marginBottom: '20px' }
      }, 'Auto One-Click Admin Settings'),

      // Description
      React.createElement('p', {
        style: { marginBottom: '20px', color: '#666' }
      },
        'When enabled, this addon automatically configures one-click admin ' +
        'for all new sites using the first administrator user.'
      ),

      // Error display
      error && React.createElement('div', {
        style: {
          padding: '10px 15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#856404',
        }
      }, error),

      // Settings form
      React.createElement('div', {
        style: { backgroundColor: 'white', padding: '20px', borderRadius: '4px' }
      },
        // Enable toggle
        React.createElement('label', {
          style: {
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }
        },
          React.createElement('input', {
            type: 'checkbox',
            checked: enabled,
            onChange: this.handleToggle,
            style: { marginRight: '12px', width: '18px', height: '18px' }
          }),
          React.createElement('span', {
            style: { fontSize: '14px' }
          }, 'Automatically enable one-click admin for new sites')
        ),

        // Help text
        React.createElement('p', {
          style: {
            marginTop: '10px',
            marginBottom: 0,
            marginLeft: '30px',
            fontSize: '13px',
            color: '#888',
          }
        },
          'Applies to newly created, imported, and cloned sites. ' +
          'Existing sites are not affected.'
        )
      ),

      // Info box
      React.createElement('div', {
        style: {
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d7ff',
          borderRadius: '4px',
          fontSize: '13px',
        }
      },
        React.createElement('strong', null, 'How it works: '),
        'When a new site is created, this addon waits for the site to start, ' +
        'then uses WP-CLI to find the first administrator user and configures ' +
        'one-click admin with that user.'
      )
    );
  }
}

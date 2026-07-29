import { createContext, useContext, useReducer, useEffect } from 'react';
import { campers as seedCampers } from '../data/campers';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

const AppContext = createContext(null);

function loadState() {
  try {
    const saved = localStorage.getItem('campDavid2026');
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return null;
}

const initialState = {
  currentUser: null, // includes token, permissions, role, etc.
  notifications: [],
  campers: seedCampers,
  attendance: {},
  incidents: [],
  announcements: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      // Store token securely
      localStorage.setItem('camp_token', action.payload.token);
      return { ...state, currentUser: action.payload.user };

    case 'LOGOUT':
      localStorage.removeItem('camp_token');
      return { ...state, currentUser: null, notifications: [] };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        currentUser: { ...state.currentUser, ...action.payload }
      };

    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, isRead: true } : n
        )
      };

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true }))
      };

    case 'SET_ATTENDANCE': {
      const { sessionKey, camperId, status } = action.payload;
      return {
        ...state,
        attendance: {
          ...state.attendance,
          [sessionKey]: {
            ...(state.attendance[sessionKey] || {}),
            [camperId]: status,
          },
        },
      };
    }

    case 'BULK_ATTENDANCE': {
      const { sessionKey, camperIds, status } = action.payload;
      const sessionData = { ...(state.attendance[sessionKey] || {}) };
      camperIds.forEach((id) => { sessionData[id] = status; });
      return {
        ...state,
        attendance: { ...state.attendance, [sessionKey]: sessionData },
      };
    }

    case 'SET_ATTENDANCE_MAP':
      return {
        ...state,
        attendance: action.payload || {},
      };

    case 'SET_INCIDENTS':
      return { ...state, incidents: action.payload || [] };

    case 'SET_ANNOUNCEMENTS':
      return { ...state, announcements: action.payload || [] };

    case 'SET_PROGRAM_SESSIONS':
      return { ...state, programSessions: action.payload || [] };

    case 'ADD_INCIDENT':
      return { ...state, incidents: [action.payload, ...state.incidents] };

    case 'UPDATE_INCIDENT_STATUS':
      return {
        ...state,
        incidents: state.incidents.map((inc) =>
          inc.id === action.payload.id ? { ...inc, status: action.payload.status } : inc
        ),
      };

    case 'ADD_ANNOUNCEMENT':
      return { ...state, announcements: [action.payload, ...state.announcements] };

    case 'SET_CAMPERS':
      return { ...state, campers: action.payload };

    case 'ADD_CAMPERS':
      return { ...state, campers: [...state.campers, ...action.payload] };

    case 'LOAD_STATE':
      return { ...action.payload, currentUser: state.currentUser, notifications: state.notifications };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const saved = loadState();
  const init = saved ? { ...initialState, ...saved, notifications: [] } : initialState;
  const [state, dispatch] = useReducer(reducer, init);

  useEffect(() => {
    const { notifications, ...rest } = state;
    localStorage.setItem('campDavid2026', JSON.stringify(rest));
  }, [state]);

  // Unified 15-second sync service: fetches campers, attendance, incidents, and announcements/programme in 1 batched call
  useEffect(() => {
    const fetchBatchedData = async () => {
      const token = localStorage.getItem('camp_token');
      if (!token) return;

      try {
        // Single batched sync call to keep DB query threshold low
        const syncRes = await fetch(`${API}/api/sync/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (syncRes.ok) {
          const data = await syncRes.json();
          if (data.campers && data.campers.length > 0) {
            dispatch({ type: 'SET_CAMPERS', payload: data.campers });
          }
          if (data.attendance && typeof data.attendance === 'object') {
            dispatch({ type: 'SET_ATTENDANCE_MAP', payload: data.attendance });
          }
          if (data.incidents && Array.isArray(data.incidents)) {
            dispatch({ type: 'SET_INCIDENTS', payload: data.incidents });
          }
          if (data.announcements && Array.isArray(data.announcements)) {
            dispatch({ type: 'SET_ANNOUNCEMENTS', payload: data.announcements });
          }
          if (data.programSessions && Array.isArray(data.programSessions)) {
            dispatch({ type: 'SET_PROGRAM_SESSIONS', payload: data.programSessions });
          }
          return;
        }

        // Fallback: parallel sync calls tied together in Promise.all
        const [campersRes, attRes, incRes, annRes] = await Promise.all([
          fetch(`${API}/api/campers?limit=500&status=all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/attendance/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/incidents`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (campersRes.ok) {
          const campersData = await campersRes.json();
          const list = Array.isArray(campersData) ? campersData : (campersData.campers || []);
          if (list.length > 0) dispatch({ type: 'SET_CAMPERS', payload: list });
        }
        if (attRes.ok) {
          const attMap = await attRes.json();
          if (attMap && typeof attMap === 'object') dispatch({ type: 'SET_ATTENDANCE_MAP', payload: attMap });
        }
        if (incRes.ok) {
          const incData = await incRes.json();
          const list = Array.isArray(incData) ? incData : (incData.incidents || []);
          dispatch({ type: 'SET_INCIDENTS', payload: list });
        }
        if (annRes.ok) {
          const annData = await annRes.json();
          const list = Array.isArray(annData) ? annData : (annData.announcements || []);
          dispatch({ type: 'SET_ANNOUNCEMENTS', payload: list });
        }
      } catch (err) {
        console.error('Failed to sync batched data from API:', err);
      }
    };

    fetchBatchedData();

    // 15-second background poll for multi-device sync
    const interval = setInterval(fetchBatchedData, 15000);
    return () => clearInterval(interval);
  }, [state.currentUser]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

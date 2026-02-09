/**
 * Shared styles for Field Readings App
 * 
 * Split into loginStyles and readingsStyles
 * Imported by LoginPage and ReadingsPage components
 */

export const loginStyles = {
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  loginTitle: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '600',
    color: '#222',
  },
  loginSubtitle: {
    margin: '0 0 30px 0',
    fontSize: '14px',
    color: '#666',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
  },
  submitButton: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    fontSize: '14px',
  },
} as const;

export const readingsStyles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#fafafa',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  },
  pageTitle: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    fontWeight: '600',
    color: '#222',
  },
  userName: {
    margin: '0',
    fontSize: '13px',
    color: '#666',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  content: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '6px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  autocompleteContainer: {
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
  },
  dropdownItem: {
    padding: '10px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
  },
  selectedCommunity: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500',
  },
  tableHeader: {
    marginBottom: '12px',
  },
  tableHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  selectAllBtn: {
    fontSize: '18px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
  },
  tableTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeadRow: {
    backgroundColor: '#f9f9f9',
    borderBottom: '2px solid #e0e0e0',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#333',
  },
  thCheckbox: {
    padding: '12px',
    width: '50px',
    textAlign: 'center',
  },
  tableRow: {
    borderBottom: '1px solid #e0e0e0',
  },
  td: {
    padding: '12px',
  },
  tdCheckbox: {
    padding: '12px',
    textAlign: 'center',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  readingInput: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    marginTop: '16px',
    borderTop: '1px solid #e0e0e0',
  },
  actionBarText: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
  },
  noData: {
    padding: '40px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#999',
  },
} as const;
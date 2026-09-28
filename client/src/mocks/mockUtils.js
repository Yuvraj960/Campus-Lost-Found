export const mockDelay = (ms = 350) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const checkMockError = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mockError') === '1') {
      const err = new Error('Simulated mock network error');
      err.code = 'SIMULATED_ERROR';
      throw err;
    }
  }
};

module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/graph',
        permanent: true,
      },
    ];
  },
};

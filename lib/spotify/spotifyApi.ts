export type SpotifyUserInfo = {
  id: string;
  email: string;
  name: string;
  locale?: string;
  country?: string;
  product?: string;
};

export type SpotifyListeningData = {
  topArtists: string[];
  recentTracks: string[];
  genres: string[];
};

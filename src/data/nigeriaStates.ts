export interface NigerianStateInfo {
  name: string;
  capital: string;
  zone: 'North Central' | 'North East' | 'North West' | 'South East' | 'South South' | 'South West';
  slogan: string;
  popularCities: string[];
}

export const NIGERIAN_STATES: NigerianStateInfo[] = [
  { name: 'Abia', capital: 'Umuahia', zone: 'South East', slogan: "God's Own State", popularCities: ['Aba', 'Umuahia', 'Ohafia'] },
  { name: 'Adamawa', capital: 'Yola', zone: 'North East', slogan: 'Land of Beauty', popularCities: ['Yola', 'Jimeta', 'Mubi'] },
  { name: 'Akwa Ibom', capital: 'Uyo', zone: 'South South', slogan: 'Land of Promise', popularCities: ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron'] },
  { name: 'Anambra', capital: 'Awka', zone: 'South East', slogan: 'Light of the Nation', popularCities: ['Onitsha', 'Awka', 'Nnewi'] },
  { name: 'Bauchi', capital: 'Bauchi', zone: 'North East', slogan: 'Pearl of Tourism', popularCities: ['Bauchi', 'Azare', 'Misau'] },
  { name: 'Bayelsa', capital: 'Yenagoa', zone: 'South South', slogan: 'Glory of All Lands', popularCities: ['Yenagoa', 'Brass', 'Ogbia'] },
  { name: 'Benue', capital: 'Makurdi', zone: 'North Central', slogan: 'Food Basket of the Nation', popularCities: ['Makurdi', 'Gboko', 'Otukpo'] },
  { name: 'Borno', capital: 'Maiduguri', zone: 'North East', slogan: 'Home of Peace', popularCities: ['Maiduguri', 'Biu', 'Bama'] },
  { name: 'Cross River', capital: 'Calabar', zone: 'South South', slogan: "The People's Paradise", popularCities: ['Calabar', 'Ikom', 'Ogoja'] },
  { name: 'Delta', capital: 'Asaba', zone: 'South South', slogan: 'The Big Heart', popularCities: ['Warri', 'Asaba', 'Sapele', 'Ughelli'] },
  { name: 'Ebonyi', capital: 'Abakaliki', zone: 'South East', slogan: 'Salt of the Nation', popularCities: ['Abakaliki', 'Afikpo', 'Onueke'] },
  { name: 'Edo', capital: 'Benin City', zone: 'South South', slogan: 'Heart Beat of the Nation', popularCities: ['Benin City', 'Auchi', 'Ekpoma'] },
  { name: 'Ekiti', capital: 'Ado-Ekiti', zone: 'South West', slogan: 'Land of Honour and Integrity', popularCities: ['Ado-Ekiti', 'Ikere-Ekiti', 'Ijero'] },
  { name: 'Enugu', capital: 'Enugu', zone: 'South East', slogan: 'Coal City State', popularCities: ['Enugu', 'Nsukka', 'Oji River'] },
  { name: 'FCT (Abuja)', capital: 'Abuja', zone: 'North Central', slogan: 'Centre of Unity', popularCities: ['Maitama', 'Garki', 'Wuse', 'Gwarinpa', 'Asokoro'] },
  { name: 'Gombe', capital: 'Gombe', zone: 'North East', slogan: 'Jewel in the Savannah', popularCities: ['Gombe', 'Kaltungo', 'Billiri'] },
  { name: 'Imo', capital: 'Owerri', zone: 'South East', slogan: 'Eastern Heartland', popularCities: ['Owerri', 'Orlu', 'Okigwe'] },
  { name: 'Jigawa', capital: 'Dutse', zone: 'North West', slogan: 'The New World', popularCities: ['Dutse', 'Hadejia', 'Gumel'] },
  { name: 'Kaduna', capital: 'Kaduna', zone: 'North West', slogan: 'Centre of Learning', popularCities: ['Kaduna', 'Zaria', 'Kafanchan'] },
  { name: 'Kano', capital: 'Kano', zone: 'North West', slogan: 'Centre of Commerce', popularCities: ['Kano', 'Wudil', 'Rano'] },
  { name: 'Katsina', capital: 'Katsina', zone: 'North West', slogan: 'Home of Hospitality', popularCities: ['Katsina', 'Daura', 'Funtua'] },
  { name: 'Kebbi', capital: 'Birnin Kebbi', zone: 'North West', slogan: 'Land of Equity', popularCities: ['Birnin Kebbi', 'Argungu', 'Yauri'] },
  { name: 'Kogi', capital: 'Lokoja', zone: 'North Central', slogan: 'The Confluence State', popularCities: ['Lokoja', 'Okene', 'Kabba'] },
  { name: 'Kwara', capital: 'Ilorin', zone: 'North Central', slogan: 'State of Harmony', popularCities: ['Ilorin', 'Offa', 'Omu-Aran'] },
  { name: 'Lagos', capital: 'Ikeja', zone: 'South West', slogan: 'Centre of Excellence', popularCities: ['Ikeja', 'Lekki', 'Victoria Island', 'Yaba', 'Surulere', 'Ikorodu'] },
  { name: 'Nasarawa', capital: 'Lafia', zone: 'North Central', slogan: "Home of Solid Minerals", popularCities: ['Lafia', 'Keffi', 'Akwanga', 'Mararaba'] },
  { name: 'Niger', capital: 'Minna', zone: 'North Central', slogan: 'The Power State', popularCities: ['Minna', 'Bida', 'Suleja', 'Kontagora'] },
  { name: 'Ogun', capital: 'Abeokuta', zone: 'South West', slogan: 'Gateway State', popularCities: ['Abeokuta', 'Ijebu Ode', 'Sagamu', 'Ota'] },
  { name: 'Ondo', capital: 'Akure', zone: 'South West', slogan: 'Sunshine State', popularCities: ['Akure', 'Ondo', 'Owo', 'Ikare'] },
  { name: 'Osun', capital: 'Osogbo', zone: 'South West', slogan: 'Land of Virtue', popularCities: ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede'] },
  { name: 'Oyo', capital: 'Ibadan', zone: 'South West', slogan: 'Pace Setter State', popularCities: ['Ibadan', 'Ogbomoso', 'Oyo', 'Saki'] },
  { name: 'Plateau', capital: 'Jos', zone: 'North Central', slogan: 'Home of Peace and Tourism', popularCities: ['Jos', 'Bukuru', 'Pankshin'] },
  { name: 'Rivers', capital: 'Port Harcourt', zone: 'South South', slogan: 'Treasure Base of the Nation', popularCities: ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Eleme'] },
  { name: 'Sokoto', capital: 'Sokoto', zone: 'North West', slogan: 'Seat of the Caliphate', popularCities: ['Sokoto', 'Tambuwal', 'Gwadabawa'] },
  { name: 'Taraba', capital: 'Jalingo', zone: 'North East', slogan: "Nature's Gift to the Nation", popularCities: ['Jalingo', 'Wukari', 'Bali'] },
  { name: 'Yobe', capital: 'Damaturu', zone: 'North East', slogan: 'Pride of the Sahel', popularCities: ['Damaturu', 'Potiskum', 'Gashua'] },
  { name: 'Zamfara', capital: 'Gusau', zone: 'North West', slogan: 'Farming is Our Pride', popularCities: ['Gusau', 'Kaura Namoda', 'Talata Mafara'] },
];

export const POPULAR_INTERESTS = [
  'Tech & Software',
  'Afrobeats & Music',
  'Business & Startups',
  'Football & Sports',
  'Food & Naija Cuisine',
  'Culture & Arts',
  'Fashion & Ankara',
  'University Life',
  'Photography',
  'Agriculture & Agribusiness',
  'Real Estate',
  'Reading & Books',
  'Fitness & Wellness',
  'Travel & Tourism',
  'Public Policy',
  'Content Creation',
];

const fs = require('fs'),
    mapping = {
        'Blues_Snare_Drags': 46,
        'Blues_Snare_Hit': 44,
        'Blues_Snare_Sidesticks': 45,
        'Bright_Z18_Edge': 79,
        'Bright_Z18_Hit': 102,
        'Bright_Z20_Edge': 125,
        'Bright_Z20_Hit': 126,
        'Bright_ZChina_Edge': 107,
        'Bright_ZChina_Hit': 100,
        'Bright_ZHH_3QS': 83,
        'Bright_ZHH_3QT': 89,
        'Bright_ZHH_CS': 80,
        'Bright_ZHH_CT': 86,
        'Bright_ZHH_HalfS': 82,
        'Bright_ZHH_HalfT': 88,
        'Bright_ZHH_OpenS': 84,
        'Bright_ZHH_OpenT': 90,
        'Bright_ZHH_Pedal': 85,
        'Bright_ZHH_QuarterS': 81,
        'Bright_ZHH_QuarterT': 87,
        'Bright_Zing_Bell': 122,
        'Bright_Zing_Edge': 123,
        'Bright_Zing_Hit': 124,
        'Cajon_10_Open': 5,
        'Cajon_10_Slap': 6,
        'Cajon_12_Open': 7,
        'Cajon_14_Open': 8,
        'ChinaEdge_St': 113,
        'ChinaHit_St': 114,
        'Cowbell_High_Hit': 104,
        'Cowbell_Low_Hit': 105,
        'Dark_16_Stick_Choke': 109,
        'Dark_18_Stick_Choke': 108,
        'Dark_Crash_16_Brushes_Hit': 112,
        'Dark_Crash_18_Sizzle_Brushes_Hit': 111,
        'Dark_Ride_20_Brushes_Hit': 17,
        'Dark_Jazz_Hat_3QS_St': 14,
        'Dark_Jazz_Hat_CS_St': 10,
        'Dark_Jazz_Hat_CT_St': 11,
        'Dark_Jazz_Hat_HalfS_St': 13,
        'Dark_Jazz_Hat_OpenS_St': 15,
        'Dark_Jazz_Hat_Pedal_St': 16,
        'Dark_Jazz_Hat_QuarterS_St': 12,
        'Dry_Ride_24_Stick_Bell': 94,
        'Dry_Ride_24_Stick_Tip': 93,
        'Funk_Kick_Hit': 20,
        'Jazz_Kick_Hit': 28,
        'Jazz_Ride_Bell_St': 116,
        'Jazz_Ride_Edge_St': 121,
        'Jazz_Ride_Hit_St': 115,
        'Jazz_Ride_Sizzle_Bell_St': 118,
        'Jazz_Ride_Sizzle_Hit_St': 117,
        'Latin_Snare_Sticks_CS': 48,
        'Latin_Snare_Sticks_Drag': 49,
        'Latin_Snare_Sticks_Hit': 47,
        'Metal_Kick_Hit': 25,
        'Modern_Snare_Brush_Hit': 53,
        'Modern_Snare_Brush_Swirl': 54,
        'Modern_Snare_Sticks_Drag': 40,
        'Modern_Snare_Sticks_Hit': 38,
        'Modern_Soft_Swirl_01': 56,
        'Modern_Tom_2_Muffled_Sticks_Hit': 76,
        'Modern_Tom_2_Open_Sticks_Hit': 59,
        'Modern_Tom_3_Muffled_Sticks_Hit': 77,
        'Modern_Tom_3_Open_Sticks_Hit': 60,
        'Modern_Tom_4_Open_Sticks_Hit': 61,
        'Modern_Tom_5_Muffled_Sticks_Hit': 78,
        'Modern_Tom_5_Open_Sticks_Hit': 62,
        'Quinto_Open': 4,
        'Quinto_Slap': 3,
        'Reggae_Snare_Sticks_CS': 36,
        'Reggae_Snare_Sticks_Drag': 37,
        'Reggae_Snare_Sticks_Hit': 35,
        'Reggae_Snares_Off_Sticks_Hit': 39,
        'Rock_Kick_Hit': 23,
        'Rock_Tom_1_Hit': 71,
        'Rock_Tom_2_Hit': 72,
        'Rock_Tom_3_Hit': 73,
        'Rock_Tom_5_Hit': 74,
        'Soul_Snare_Sticks_CS': 51,
        'Soul_Snare_Sticks_Drag': 52,
        'Soul_Snare_Sticks_Hit': 50,
        'Sweet_18_Crash_Stick_Choke': 106,
        'Sweet_18_Crash_Stick_Hit': 99,
        'Sweet_Crash_12_Stick_Hit': 97,
        'Sweet_Crash_16_Stick': 98,
        'Sweet_Crash_16_Stick_Choke': 95,
        'Sweet_Splash_11_Stick_Hit': 96,
        'Thor_Kick_Hit': 21,
        'Thor_Snare_Drag': 34,
        'Thor_Snare_Hit': 32,
        'Thor_Snare_Sidestick': 33,
        'Tight_Kick': 26,
        'Tom_5_Vintage_Open_Brushes_Hit': 57,
        'Tom_8_Vintage_Open_Brushes_Hit': 58,
        'Tumba_Open': 2,
        'Tumba_Thump': 1,
        'Vintage_Open_Tom_1_Sticks_Hit': 66,
        'Vintage_Open_Tom_3_Sticks_Hit': 67,
        'Vintage_Open_Tom_4_Sticks_Hit': 68,
        'Vintage_Open_Tom_5_Sticks_Hit': 69,
        'Vintage_Open_Tom_6_Sticks_Hit': 119,
        'Vintage_Open_Tom_7_Sticks_Hit': 120,
        'b07_cakhitomL': 75,
        'claves': 9
    };

module.exports.use = (trsFilename, panningFilename, reverbFilename) => {
    const trsContents = fs.readFileSync(trsFilename)
            .toString()
            .split('\n'),
        panningContents = fs.readFileSync(panningFilename)
            .toString()
            .split('\n'),
        reverbContents = fs.readFileSync(reverbFilename)
            .toString()
            .split('\n');

    panningContents.forEach((line, i) => {
        panningContents[i] = parseInt(line.split(':')[1], 10);
    });

    reverbContents.forEach((line, i) => {
        reverbContents[i] = parseInt(line.split(':')[1], 10);
    });

    trsContents.forEach((line, i) => {
        let item = {},
            A = line.split(':');

        item.noteNum = parseInt(A[0], 10);
        A = A[1].split('|');
        item.category = A[0];
        item.name = A[1];
        item.panning = panningContents[item.noteNum - 1];
        item.reverb = reverbContents[item.noteNum - 1];
        trsContents[i] = item;
    });

    this.entries = trsContents;

    return this;
};

module.exports.find = item => {
    let result = null;

    this.entries.every(trsEntry => {
        let cont = true;

        if (mapping[item.name] === parseInt(trsEntry.noteNum, 10)) {
            result = trsEntry;
            cont = false;
        }
        return cont;
    });

    return result;
};

module.exports.byNote = noteNum => {
    let result = null;

    Object.keys(mapping).every(key => {
        let cont = true;

        if (mapping[key] === noteNum) {
            result = key;
            cont = false;
        }
        return cont;
    });

    return result;
};

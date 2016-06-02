/*
Copyright (c) 2012-2016 Massachusetts Institute of Technology

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var personaHash = {};
personaHash["GD"] = "games/development";
personaHash["SC"] = "social computing";
personaHash["IT"] = "interaction techniques; technology; hardware (UIST)";
personaHash["MO"] = "mobile (apps and devices)";
personaHash["UX"] = "usability and user experience";
personaHash["DE"] = "design (practice and research); methods and processes";
personaHash["PV"] = "privacy and values";
personaHash["AC"] = "Accessibility";
personaHash["ED"] = "education and learning";
personaHash["WE"] = "Web";
personaHash["QU"] = "Qualitative";

var popularity = {};

var personas = {'AC': ['to108',
        'paper542',
        'cs158',
        'paper1608',
        'paper760',
        'cs132',
        'paper1282',
        'paper913',
        'cs125',
        'cs168',
        'paper611',
        'paper1256',
        'paper121',
        'paper1510',
        'paper1374',
        'paper1541',
        'paper1448',
        'paper333',
        'paper1901',
        'paper444',
        'paper665',
        'paper654',
        'paper716',
        'paper1487',
        'paper1252',
        'paper1226',
        'paper1382',
        'paper388',
        'paper1677',
        'paper815',
        'paper1716',
        'paper845',
        'paper174',
        'paper2019',
        'to100',
        'paper1055',
        'paper463',
        'paper1064',
        'pl109'],
 'DE': ['pl113',
        'paper532',
        'paper1023',
        'paper416',
        'paper726',
        'paper1052',
        'cs119',
        'paper1877',
        'paper942',
        'paper1044',
        'pl118',
        'paper232',
        'paper1688',
        'cs165',
        'cs112',
        'paper1861',
        'paper134',
        'paper956',
        'paper1885',
        'pl101',
        'paper1926',
        'paper360',
        'cs128',
        'cs110',
        'paper1993',
        'pl121',
        'paper552',
        'to119',
        'paper2003',
        'cs203',
        'pl111',
        'pl110',
        'paper776',
        'paper1466',
        'to102',
        'cs180',
        'paper135',
        'paper1727',
        'paper1415',
        'cs116',
        'paper1904',
        'paper1125',
        'paper1260',
        'paper774'],
 'ED': ['paper832',
        'cs191',
        'cs171',
        'paper1274',
        'paper1983',
        'paper1011',
        'cs188',
        'cs101',
        'paper141',
        'paper1153',
        'paper984',
        'cs170',
        'to108',
        'paper542',
        'cs158',
        'paper1608',
        'paper481',
        'paper1378',
        'paper1330',
        'paper602',
        'pl103',
        'pl109'],
 'GD': ['paper481',
        'paper1378',
        'paper1330',
        'paper602',
        'paper1142',
        'paper418',
        'paper306',
        'cs161',
        'paper1837',
        'paper1546',
        'paper1870',
        'paper1075',
        'paper1563',
        'cs141',
        'paper1377',
        'paper1531',
        'paper1354',
        'paper138',
        'cs144',
        'paper670',
        'paper712',
        'paper1799',
        'cs124'],
 'IT': ['paper808',
        'paper1182',
        'paper1539',
        'paper512',
        'paper747',
        'paper538',
        'paper941',
        'paper868',
        'paper1218',
        'paper805',
        'paper1255',
        'paper1012',
        'paper1229',
        'cs184',
        'paper689',
        'paper1280',
        'paper1882',
        'paper1196',
        'cs114',
        'paper1848',
        'paper118',
        'paper1788',
        'to109',
        'paper132',
        'paper531',
        'to115',
        'cs189',
        'paper1371',
        'paper1142',
        'paper418',
        'paper306',
        'cs161',
        'paper1552',
        'paper265',
        'cs197',
        'paper422',
        'paper995',
        'paper1224',
        'paper1223',
        'paper1262',
        'paper1878',
        'paper1070',
        'paper1849',
        'paper1239',
        'paper767',
        'paper1830',
        'paper634',
        'paper1285',
        'paper1915',
        'paper423',
        'paper1130',
        'cs150',
        'paper1959',
        'paper554',
        'paper256',
        'paper1133',
        'pl103',
        'paper1102',
        'paper789',
        'paper515',
        'paper612',
        'paper1978',
        'paper1620',
        'paper2001',
        'paper1970',
        'paper478',
        'paper2023',
        'paper1768',
        'paper1909',
        'paper495',
        'paper740',
        'paper817',
        'paper1019',
        'paper989',
        'paper333',
        'paper1901',
        'paper444',
        'paper665',
        'paper622',
        'paper251',
        'paper1562',
        'paper1067',
        'paper474',
        'paper1647',
        'paper657',
        'paper1351',
        'paper513',
        'paper1565',
        'paper379',
        'paper564',
        'paper548',
        'paper497',
        'pl106',
        'paper1158',
        'paper1119',
        'paper1056',
        'paper1607',
        'paper231',
        'paper1046',
        'paper373',
        'paper1411',
        'paper359',
        'paper1888',
        'paper1621',
        'paper488',
        'paper131',
        'paper104',
        'paper1226',
        'paper1382',
        'paper388',
        'paper1677',
        'paper815',
        'paper1961',
        'paper1525',
        'paper1234',
        'paper608',
        'paper449',
        'paper814',
        'paper1066',
        'paper229',
        'paper1147',
        'paper981',
        'paper1366',
        'paper499',
        'paper1766',
        'paper178',
        'paper1015',
        'paper1912',
        'paper209',
        'paper1700',
        'paper396',
        'paper854',
        'paper270',
        'paper1193',
        'paper263',
        'to118',
        'to107',
        'paper517',
        'paper489',
        'paper1027',
        'paper791',
        'paper631',
        'paper1833',
        'paper730',
        'to100',
        'paper1055',
        'paper463',
        'paper1064',
        'paper1838',
        'cs104',
        'paper534',
        'cs164',
        'paper1457',
        'paper1533',
        'paper1987',
        'paper1967',
        'paper1073',
        'pl109',
        'paper405',
        'paper329',
        'paper1347',
        'paper103',
        'to122',
        'paper1916',
        'paper672',
        'cs162',
        'paper408',
        'paper1174',
        'paper1699',
        'paper1271',
        'paper1121',
        'paper679',
        'paper892',
        'paper1444',
        'paper196',
        'paper468',
        'to116',
        'paper1485',
        'paper1065',
        'paper986'],
 'MO': ['paper633',
        'paper915',
        'paper580',
        'paper1585',
        'paper296',
        'paper781',
        'paper977',
        'paper732',
        'cs202',
        'paper1552',
        'paper265',
        'cs197',
        'paper422',
        'paper995',
        'paper1102',
        'paper789',
        'paper515',
        'paper612',
        'paper1158',
        'paper1119',
        'paper1056',
        'paper1607',
        'paper231',
        'paper1961',
        'paper1525',
        'paper1234',
        'paper608',
        'to100',
        'paper1055',
        'paper463',
        'paper1064',
        'cs137',
        'paper1369',
        'paper905',
        'cs195',
        'paper214',
        'paper718',
        'paper1314',
        'cs113',
        'paper1171',
        'paper405',
        'paper329',
        'paper1347',
        'paper103'],
 'PV': ['paper1152',
        'to110',
        'paper1952',
        'paper1610',
        'cs152',
        'paper760',
        'cs132',
        'paper1282',
        'paper913',
        'cs125',
        'paper982',
        'paper1043',
        'paper1172',
        'paper1116',
        'paper2028',
        'to120',
        'paper1646',
        'paper594',
        'paper1574'],
 'QU': ['paper1152',
        'to110',
        'paper1952',
        'paper1610',
        'cs152',
        'paper136',
        'paper1145',
        'paper1841',
        'paper1817',
        'paper1202',
        'paper1758',
        'cs143',
        'paper1587',
        'cs102',
        'paper1523',
        'paper1102',
        'paper789',
        'paper515',
        'paper612',
        'pl120',
        'pl121',
        'paper461',
        'paper643',
        'paper485',
        'paper1189',
        'to101',
        'paper139',
        'paper1881',
        'paper194',
        'cs137',
        'paper1369',
        'paper905',
        'cs195',
        'paper1045',
        'paper1924',
        'paper1320',
        'paper491',
        'paper1195',
        'paper1429',
        'paper494',
        'paper1071',
        'paper1236',
        'cs169'],
 'SC': ['paper1063',
        'paper875',
        'paper150',
        'paper1825',
        'paper120',
        'paper633',
        'paper915',
        'paper580',
        'paper1585',
        'to112',
        'to113',
        'cs149',
        'cs155',
        'paper314',
        'paper136',
        'paper1145',
        'paper1841',
        'paper1817',
        'paper1202',
        'paper1086',
        'to105',
        'paper498',
        'paper756',
        'paper1350',
        'paper1859',
        'paper990',
        'cs138',
        'paper1505',
        'paper615',
        'paper1678',
        'paper1095',
        'paper1233',
        'paper1944',
        'paper1601',
        'paper690',
        'paper647',
        'cs199',
        'paper1537',
        'paper1573',
        'cs167',
        'cs123',
        'paper1750',
        'paper1959',
        'paper554',
        'paper256',
        'paper1133',
        'paper1126',
        'paper340',
        'paper1359',
        'to106',
        'paper379',
        'paper564',
        'paper548',
        'paper497',
        'paper461',
        'paper643',
        'paper485',
        'paper1189',
        'pl111',
        'to114',
        'paper804',
        'paper313',
        'paper1278',
        'paper1045',
        'paper1924',
        'paper1320',
        'paper491',
        'paper1195',
        'paper1210',
        'paper1923',
        'to103',
        'paper1168',
        'paper773',
        'cs177',
        'paper1288',
        'paper1110',
        'paper1391',
        'to111',
        'paper1548',
        'paper1652',
        'to123'],
 'UX': ['pl113',
        'paper532',
        'paper1023',
        'paper416',
        'paper726',
        'paper1052',
        'paper365',
        'paper784',
        'paper1706',
        'paper1253',
        'paper572',
        'paper132',
        'paper531',
        'to115',
        'cs189',
        'paper1371',
        'paper481',
        'paper1378',
        'paper1330',
        'paper602',
        'paper1861',
        'paper134',
        'paper956',
        'paper1885',
        'pl103',
        'pl108',
        'paper465',
        'paper484',
        'paper1053',
        'paper412',
        'paper1510',
        'paper1374',
        'paper1541',
        'paper1448',
        'paper495',
        'paper740',
        'paper817',
        'paper1019',
        'paper989',
        'pl121',
        'paper1647',
        'paper657',
        'paper1351',
        'paper513',
        'paper1565',
        'pl106',
        'paper1046',
        'paper373',
        'paper1411',
        'paper359',
        'paper1888',
        'paper992',
        'paper818',
        'paper2022',
        'paper933',
        'paper1392',
        'paper981',
        'paper1366',
        'paper499',
        'paper1766',
        'paper178',
        'paper1015',
        'paper214',
        'paper718',
        'paper1314',
        'cs113',
        'paper1171',
        'pl109',
        'paper156',
        'cs151',
        'paper428',
        'paper1490',
        'paper1752',
        'to122',
        'paper1916',
        'paper672',
        'cs162',
        'cs177',
        'paper1288',
        'paper1110',
        'paper1391'],
 'WE': ['paper1350',
        'paper1859',
        'paper990',
        'cs138',
        'paper605',
        'paper464',
        'to121',
        'paper521',
        'cs117',
        'paper1959',
        'paper554',
        'paper256',
        'paper1133',
        'paper1357',
        'paper236',
        'paper175',
        'cs127',
        'paper379',
        'paper564',
        'paper548',
        'paper497',
        'pl111',
        'paper917',
        'paper1910',
        'paper1695',
        'paper1057',
        'paper1676',
        'paper282',
        'paper1880',
        'cs103',
        'paper1210',
        'paper1923',
        'to103',
        'paper1168',
        'paper773',
        'paper408',
        'paper1174',
        'paper1699',
        'paper1271',
        'paper1121']}
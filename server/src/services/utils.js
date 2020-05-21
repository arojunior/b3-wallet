const { MONTHS } = require(`../constants`);

exports.flatMap = (a) => [].concat(...a);

exports.onlyUnique = (value, index, self) => self.indexOf(value) === index;

const normalizeText = (value) =>
  value
    .normalize(`NFD`)
    .replace(/[\u0300-\u036f]/g, ``)
    .replace(/ /g, `_`);

exports.normalizeObjectKeys = (obj) => {
  Object.keys(obj).forEach((key) => {
    const newKey = normalizeText(key);

    if (key !== newKey) {
      Object.defineProperty(obj, newKey, Object.getOwnPropertyDescriptor(obj, key));
      delete obj[key];
    }
  });

  return obj;
};

exports.convertStringToDate = (value) => {
  const pieces = value.split(`/`);
  const year = pieces[2];
  const month = pieces[1];
  const day = pieces[0];
  return new Date(`${year}-${month}-${day}`);
};

exports.convertStringToMoney = (value) => {
  return Number(value.replace(`.`, ``).replace(`,`, `.`));
};

exports.monthToName = (value) => {
  return MONTHS[Number(value.split(`/`)[1])];
};

exports.toNumber = (value) => parseInt(value.replace(`.`, ``).replace(`,`, `.`), 10);

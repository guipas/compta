'use strict';

const fs = require(`fs`);
const moment = require('moment');
const beautify = require("json-beautify");
const csvParse = require(`csv-parse/lib/sync`);
const uuid = require('uuid');

const ING_INDEX_LABEL = 1;
const ING_INDEX_DATE = 0;
const ING_INDEX_AMOUNT = 3;
const ING_INDEX_CATEGORY = 5;
const ING_DEFAULT_LEDGER_NAME = `Comptes:Courant`;

const compta = {};
compta.tools = {};
compta.importers = {};

compta.importers.ing_csv = function (fileContent, options = {}) {
  const lines = csvParse(fileContent, { delimiter : `;` });
  const book = new SingleEntryBook(null, {name : ING_DEFAULT_LEDGER_NAME});

  lines.forEach(fields => {
    const amount = parseFloat(fields[ING_INDEX_AMOUNT].replace(',','.'));
    const date = moment(fields[ING_INDEX_DATE], `DD/MM/YYYY`).toDate();
    const label = fields[ING_INDEX_LABEL];
    const category = fields[ING_INDEX_CATEGORY] ? fields[ING_INDEX_CATEGORY] : 'unknown';
    book.addLine(label, date, amount, category);
  });

  // if (options.mapCategories) book.mapCategories(options.mapFile);
  return book;
}

compta.importers.paypal_csv = function (fileName, options = {}) {
  const fileContent = fs.readFileSync(fileName, `utf8`);
  const book = new SingleEntryBook(null, `Comptes:Paypal`);

  const records = csvParse(fileContent, {
    delimiter : `,`,

  });

  records.unshift();// header
  records.forEach(record => {
    const date = moment(record[0],`DD/MM/YYYY`).toISOString();
    const amount = parseFloat(record[7]);
    const label = record[3] + record[4];
    const category = record[3];

    book.addLine(label, date, amount, category);
  })

  // if (options.mapCategories) book.mapCategories(options.mapFile);
  return book;
}



compta.listLedgersFromFile = function (fileName) {
  const book = new Book(fileName);
  const list = book.getLedgerList();
  return list;
}

class SingleEntryBook {
  constructor(rawContent) {
    this.entries = [];
    this.options = [];
    this.currentBatch = uuid.v4();
    if (rawContent) this.load(rawContent);
  }

  init() {
    const data = '';
  }

  save() {
    const obj = {
      entries : this.entries,
      name : this.name,
      options : this.options,
      currentBatch : this.currentBatch,
    }
    return JSON.stringify(obj);
  }

  startNewBatch() {
    return this.currentBatch = uuid.v4();
  }

  load(jsonString) {
    const obj = JSON.parse(jsonString);
    this.options = obj.options;
    this.name = obj.name;
    this.entries = obj.entries;
    if (obj.currentBatch) this.currentBatch = obj.currentBatch;
  }

  addLine(label, date, amount, category) {
    // console.log(line);
    const id = uuid.v4();
    this.entries.push({id, label, date, amount, category, batch : this.currentBatch})
  }

  mergeBook(book) {
    const batchId = this.startNewBatch();
    book.entries.forEach(entry => {
      this.addLine(entry.label, entry.date, entry.amount, entry.category);
    })
    this.startNewBatch();
    return batchId;
  }

  mapCategories(map = []) {
    this.entries.forEach(entry => {
      const cat = map.find(c => c[0] === entry.category);
      if (cat) {
        entry.category = cat[1];
      }
    })
  }

  print() {
    console.log(beautify(this.entries , null, 2, 100)) ;
  }

  changeEntryCategory(entryId, newCategory) {
    if (!newCategory) return;
    const entry = this.entries.find(entry => entry.id === entryId);
    if (!entry) return false;
    entry.category = newCategory;
    return true;
  }

  balance(startDate, endDate) {
    const balance = [];
    let totalGain = 0;
    let totalLoss = 0;
    this.entries.forEach(entry => {
      if (startDate && endDate && !moment(entry.date).isBetween(startDate, endDate)) {
        return;
      }
      let line = balance.find(l => l.category === entry.category);
      if (!line) balance.push(line = { category : entry.category, amount : 0, level : entry.category.match(/:/g) ? entry.category.match(/:/g).length : 0});
      line.amount += entry.amount;
      if (entry.amount > 0) totalGain += entry.amount;
      else totalLoss += entry.amount;
    })
    balance.forEach(line => {
      line.ratioGain = line.amount > 0 ? line.amount / totalGain : 0;
      line.ratioLoss = line.amount <= 0 ? line.amount / totalLoss : 0;
    })
    // console.log(balance);
    return balance;
  }

  balancePourcentage() {

  }

  balanceCategories(startDate, endDate) {
    const balance = [];
    const categories = this.getCategories();
    let totalGain = 0;
    let totalLoss = 0;
    this.entries.forEach(entry => {
      if (startDate && endDate && !moment(entry.date).isBetween(startDate, endDate)) {
        return;
      }
      categories.forEach(category => {
        if (entry.category.indexOf(category) > -1) {
          let line = balance.find(l => l.category === category);
          if (!line) {
            balance.push(line = {
              category : category,
              amount : 0,
              level : category.match(/:/g) ? category.match(/:/g).length : 0,
            });
          }
          line.amount += entry.amount;

        }
      })
      if (entry.amount > 0) totalGain += entry.amount;
      else totalLoss += entry.amount;
    })
    balance.forEach(line => {
      line.ratioGain = line.amount > 0 ? line.amount / totalGain : 0;
      line.ratioLoss = line.amount <= 0 ? line.amount / totalLoss : 0;
    })
    // console.log(balance);
    return balance;
  }

  getCategories(startDate, endDate) {
    const categories = [];
    this.entries.forEach(entry => {
      if (startDate && endDate && !moment(entry.date).isBetween(startDate, endDate)) {
        return;
      }
      let currentCat = ``;
      entry.category.split(`:`).forEach(n => {
        currentCat += currentCat.length > 0 ? `:${n}` : n;
        if (!categories.some(c => c === currentCat)) categories.push(currentCat);
      })
      currentCat = ``;
    });
    return categories;
  }


}

compta.SingleEntryBook = SingleEntryBook;

module.exports = compta;

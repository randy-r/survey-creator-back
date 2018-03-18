const express = require('express');
const json2csv = require('json2csv');
const {
  getAllAtSurveyIds
} = require('../repos/results');
const {
  getById
} = require('../repos/surveys');

const router = express.Router();
const Json2csvParser = json2csv.Parser;

// /api/results?sids[]=32&sids[]=68
// this endpoint would've made more sense with a single id
// this also gathers the follow up survey
router.get('/', function (req, res) {
  const { sids } = req.query;
  if (!sids || sids.length !== 1 ) {
    res.status(400).send('Bad Request, This endpoint supports only one survey id and it should be rewritten. Eg: /api/results?sids[]=32.');
    return;
  }

  getAllAtSurveyIds(sids)
    .then(results => {

      if (results.length === 0) {
        res.status(404).send(`No survey results found for survey ids ${sids.reduce((acc, crt) => `${acc}, ${crt}`)}`);
        return;
      }

      const pairs = results.map(r => {
        const { survey } = r;
        const { questionnaires } = survey;

        const flatSurvey = questionnaires.reduce((qacc, q, qidx) => {
          return q.items.reduce((itemacc, item, itemindex) => {
            itemacc[`survey-q-${qidx}/item-${itemindex}`] = item.answer;
            return itemacc;
          }, qacc);
        }, {});

        return ({
          result: r,
          initialRow: flatSurvey,
        });
      });


      const promises = pairs.map(({ result, initialRow }) => {
        if (!result.survey.followUpDateInfo) {
          return new Promise((resolve, reject) => resolve(null));
        }
        return getAllAtSurveyIds([result.survey.followUpDateInfo.surveyId]);
      });

      Promise.all(promises)
        .then(values => {
          const followUpSurveys = values.map(v => v ? v[0].survey : null); // first entry or null
          const trios = pairs.map((p, pi) => {
            const fuSurvey = followUpSurveys[pi];
            const ret = { ...p };
            if (fuSurvey) {
              ret.followUpRow = fuSurvey.questionnaires.reduce((qacc, q, qidx) => {
                return q.items.reduce((itemacc, item, itemindex) => {
                  itemacc[`followup-q-${qidx}/item-${itemindex}`] = item.answer;
                  return itemacc;
                }, qacc);
              }, {});
            }
            return ret;
          }); // map


          // merge the 3 data sources into 1 row
          const rows = trios.map(t => {
            const { result, initialRow, followUpRow } = t;
            const resultCopy = { ...result };
            delete resultCopy.id;
            delete resultCopy._id;
            const rtnl = resultCopy.survey.rational;
            delete resultCopy.survey;
            return { ...resultCopy, ...{ rational: rtnl }, ...t.initialRow, ...t.followUpRow };
          });

          const json2csvParser = new Json2csvParser();
          const csv = json2csvParser.parse(rows);

          // the endpoint will always be called for one survey, so take the info only from the first entry
          const s_id = trios[0].result.survey.id;
          getById(s_id, theSurvey => {

            const { name } = theSurvey;
            
            // TODO survey name and date in filename
            const filename = `results-${name}-${new Date(Date.now()).toJSON()}.csv`;
            res.setHeader('Content-disposition', `attachment; filename=${filename}`);
            res.setHeader('Content-type', 'text/plain');
            res.charset = 'UTF-8';
            res.write(csv);
            res.end();

          });// getById
        });
    }); // then
});

module.exports = router
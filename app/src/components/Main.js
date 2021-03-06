import React from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import Scroll from '../vendor/Scroll';

import TalkGrid from './TalkGrid';
import TalkPlayerTray from './TalkPlayerTray';
import TalkPane from './TalkPane';
import Analytics from '../analytics/GoogleAnalytics';

import './Main.scss';
import ovcData from '../data/ovc2016_talks.json';
import ovcTermsData from '../data/ovc2016_terms.json';
import ovcFramesData from '../data/ovc2016_frames.json';

// for convenience while debugging, put d3 and the data in window
window.d3 = d3;
window.ovcData = ovcData;

// merge terms and frames into talks
ovcData.forEach((talk, i) => {
  talk.terms = ovcTermsData[i].terms;
  talk.frames = ovcFramesData[i];

  // apply the transcript delay to the timestamps here
  // this is because the timestamps on terms is associated
  // with 0:00 being the start of the transcript, not the
  // start of the video
  talk.terms.forEach(term => {
    term.timestamps.forEach((timestamp, i) => {
      term.timestamps[i] = timestamp + talk.transcriptDelay;
    });

    // filter timestamps that start before talking in the video
    // (since transcriptDelay can be negative when there are words
    // in the transcript that aren't in the video)
    term.timestamps = term.timestamps.filter(timestamp => timestamp >= 5);
  });
});

const bodyScroll = new Scroll(document.body);

const Main = React.createClass({

  getInitialState() {
    return {
      selectedTalk: ovcData[Math.floor(Math.random() * ovcData.length)],
      touched: false
    };
  },

  _handleSelectTalk(talk) {
    this.setState({
      selectedTalk: talk
    });

    Analytics.trackEvent('select-talk', talk.id);

    // scroll to the talk if we are beneath it
    const talkPane = ReactDOM.findDOMNode(this.refs.talkPane);
    const scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;
    const talkPaneTop = talkPane.getBoundingClientRect().top + scrollTop;

    if (scrollTop > talkPaneTop) {
      bodyScroll.toElement(talkPane);
    }
  },

  // if we received a touch event, make things bigger to make touching easier
  _handleTouched() {
    if (!this.state.touched) {
      this.setState({ touched: true });
    }
  },

  render() {
    const { selectedTalk, touched } = this.state;

    return (
      <div onTouchStart={this._handleTouched}>
        <TalkPane ref='talkPane' selectedTalk={selectedTalk} allTalks={ovcData}
          touched={touched} onTalkSelect={this._handleSelectTalk} />
        <TalkGrid data={ovcData} onSelectTalk={this._handleSelectTalk} />
        <TalkPlayerTray data={selectedTalk} width={640} height={360} />
      </div>
    );
  }
});

export default Main;

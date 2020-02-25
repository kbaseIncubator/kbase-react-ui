import React, { Component } from 'react';

// Components
import { TabHeader } from '../../generic/TabHeader';
import { Filters } from './Filters';
import { ItemList } from './ItemList';
import { NarrativeDetails } from '../NarrativeList/NarrativeDetails';

// Interface
import { Item, SearchParams } from '../../../../models/Interfaces';

// Utils
import { searchNarratives } from '../../../utils/searchNarratives';
import { getUsername } from '../../../utils/auth';
import { stringify } from 'querystring';

// Page length of search results
const PAGE_SIZE = 20;
const NEW_NARR_URL = window._env.narrative + '/#narrativemanager/new';

interface State {
  // Whether we are loading data from the server
  loading: boolean;
  // List of objects of narrative details
  items: Array<Item>;
  totalItems: number;
  // Currently activated narrative details
  activeIdx: number;
  // Parameters to send to searchNarratives
  searchParams: SearchParams;
  searchCounts: { [key: string]: number };
}

interface Props {
  items?: Array<any>;
}

// This is a parent component to everything in the narrative browser (tabs,
// filters, search results, details, etc)
export class NarrativeList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      totalItems: props.items ? props.items.length : 0,
      loading: false,
      // List of narrative data
      items: props.items || [],
      // Currently active narrative result, selected on the left and shown on the right
      // This is unused if the items array is empty.
      activeIdx: 0,
      // parameters to send to the searchNarratives function
      searchParams: {
        term: '',
        sort: 'Newest',
        category: 'own',
        skip: 0,
        pageSize: PAGE_SIZE,
      },
      searchCounts: {
        own: 0,
        shared: 0,
        tutorials: 0,
        public: 0,
      },
    };
  }

  componentDidMount() {
    // FIXME this is redundant with client/index.tsx
    getUsername(username => {
      window._env.username = username;
      this.performSearch();
    });
  }

  // Handle an onSetSearch callback from Filters
  handleTermSearch(searchP: { term: string; sort: string }): void {
    const searchParams = this.state.searchParams;
    searchParams.term = searchP.term;
    searchParams.sort = searchP.sort;
    searchParams.skip = 0;
    this.setState({ searchParams });
    this.performSearch();
  }

  handleSort(sort: string): void {
    const searchParams = this.state.searchParams;
    searchParams.sort = sort;
    this.setState({ searchParams });
    this.performSearch();
  }

  // Handle an onSelectTab callback from TabHeader
  handleTabChange(idx: number, name: string): void {
    // Reset the search state and results
    const searchParams = this.state.searchParams;
    searchParams.skip = 0;
    const categoryMap: { [key: string]: string } = {
      'my narratives': 'own',
      'shared with me': 'shared',
      tutorials: 'tutorials',
      public: 'public',
    };
    // map from tab text to a more canonical name
    //  filter based on a tab name ("my narratives", "shared with me", etc)
    searchParams.category = categoryMap[name.toLowerCase()];
    // (leaving the searchParams.sort param alone)
    this.setState({
      items: [],
      activeIdx: 0,
      searchParams,
    });
    this.performSearch();
  }

  // Handle the onLoadMore callback from ItemList
  handleLoadMore() {
    const searchParams = this.state.searchParams;
    // Increment the skip size to be a multiple of the page size.
    searchParams.skip += PAGE_SIZE;
    this.setState({ searchParams });
    this.performSearch();
  }

  // Handle an onSelectItem callback from ItemList
  // Receives the index of the selected item
  handleSelectItem(idx: number) {
    this.setState({ activeIdx: idx });
  }

  performTermSearch(val: string) {
    this.setState({ loading: true });
    let searchCounts: { [key: string]: number } = {
      own: 0,
      shared: 0,
      tutorials: 0,
      public: 0,
    };

    for (let [key, value] of Object.entries(this.state.searchCounts)) {
      if (key === this.state.searchParams.category) {
        // update state and perform normal search to
        // populate narratives
        this.setState(
          (state, props) => {
            let searchParams = state.searchParams;
            searchParams.term = val;
            return { searchParams };
          },
          () => this.performSearch()
        );
      }
      // if new searchParams is not made everytime,
      // and use const searchParams = this.state.searchParams
      // searchParams.category = key
      // updates the state without using this.setState()
      const searchParams = {
        term: val,
        sort: this.state.searchParams.sort,
        category: key,
        skip: this.state.searchParams.skip,
        pageSize: this.state.searchParams.pageSize,
        musts: this.state.searchParams.musts,
        mustNots: this.state.searchParams.mustNots,
      };

      searchNarratives(searchParams).then((resp: any) => {
        if (searchCounts[key] !== resp.result.count) {
          searchCounts[key] = resp.result.count;
          this.setState({ searchCounts });
        }
      });
    }
  }
  // Perform a search and return the Promise for the fetch
  performSearch() {
    this.setState({ loading: true });
    const searchParams = this.state.searchParams;
    return searchNarratives(searchParams)
      .then((resp: any) => {
        if (resp) {
          resp = resp.result;
        }
        if (resp && resp.hits) {
          const total = resp.count;
          const items = resp.hits;
          // If we are loading a subsequent page, append to items. Otherwise, replace them.
          if (searchParams.skip > 0) {
            this.setState({
              items: this.state.items.concat(items),
              totalItems: total,
            });
          } else {
            this.setState({ items, totalItems: total });
          }
        }
      })
      .finally(() => {
        this.setState({ loading: false });
        if (searchParams.skip === 0) {
          this.setState({ activeIdx: 0 });
        }
      });
    // TODO handle error from server
  }

  render() {
    return (
      <div>
        <div className="flex justify-between">
          {/* Tab sections */}
          <div className="pt2">
            <TabHeader
              tabs={['My narratives', 'Shared with me', 'Tutorials', 'Public']}
              onSelectTab={this.handleTabChange.bind(this)}
              selectedIdx={0}
              searchCounts={this.state.searchCounts}
            />
          </div>

          {/* New narrative button */}
          <a
            className="pointer dim dib pa2 white br2 b bg-dark-green dib no-underline"
            style={{ marginTop: '1rem', height: '2.25rem' }}
            href={NEW_NARR_URL}
          >
            <i className="mr1 fa fa-plus"></i> New Narrative
          </a>
        </div>

        <div className="ba b--black-20">
          {/* Search, sort, filter */}
          <Filters
            onSetSearch={this.performTermSearch.bind(this)}
            onSelectSort={this.handleSort.bind(this)}
            loading={this.state.loading}
          />

          {/* Narrative listing and side-panel details */}
          <div className="flex">
            <ItemList
              selectedIdx={this.state.activeIdx}
              items={this.state.items}
              loading={this.state.loading}
              totalItems={this.state.totalItems}
              onLoadMore={this.handleLoadMore.bind(this)}
              onSelectItem={this.handleSelectItem.bind(this)}
            />

            <NarrativeDetails
              activeItem={this.state.items[this.state.activeIdx]}
              searchCounts={this.state.searchCounts}
            />
          </div>
        </div>
      </div>
    );
  }
}

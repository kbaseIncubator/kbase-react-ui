// import {Component, h} from 'preact';
import React, {Component} from 'react';

// Components
import {FilterDropdown} from '../../generic/FilterDropdown';
import {SearchInput} from '../../generic/SearchInput';

interface State {
  searchParams: {
    term: string,
    sort: string | null,
  },
}
interface Props {
  onSetSearch: (searchParams: State['searchParams'] ) => void;
  loading: boolean;
}
/**
 * Filter bar for searching and sorting data results
 * state:
 * searchParams:
 * - subset of parameters to send up to the NarrativeList component, which in
 *   turn sends them to the searchNarratives util
 * props:
 * - loading - bool - whether we are currently loading stuff (will put the
 *   search input in a loading state)
 * callbacks:
 * - onSetSearch - some filter has been applied to trigger a new search
 */
export class Filters extends Component<Props, State> {
  constructor(props:Props) {
    super(props);
    this.state = {
      searchParams: {
        term: '',
        sort: null,
      },
    };
  }

  // Handle an onSetVal event from SearchInput
  handleSearch(val:string) {
    const searchParams = this.state.searchParams;
    searchParams.term = val;
    this.setState({searchParams});
    if (this.props.onSetSearch) {
      this.props.onSetSearch(searchParams);
    }
  }

  // Handle an onSelect event from FilterDropdown
  handleFilter(idx:number, val:string) {
    const searchParams = this.state.searchParams;
    searchParams.sort = val;
    this.setState({searchParams});
    if (this.props.onSetSearch) {
      this.props.onSetSearch(searchParams);
    }
  }

  render() {
    const dropdownItems = ['Newest', 'Oldest', 'Recently updated', 'Least recently updated'];
    return (
      <div className='bg-light-gray flex justify-between'>
        {/* Left-aligned actions (eg. search) */}
        <div className='pa3'>
          <SearchInput loading={Boolean(this.props.loading)} onSetVal={this.handleSearch.bind(this)} />
        </div>

        {/* Right-aligned actions (eg. filter dropdown) */}
        <div className='pa2'>
          <FilterDropdown
            onSelect={this.handleFilter.bind(this)}
            txt={'Sorting by'}
            items={dropdownItems} />
        </div>
      </div>
    );
  }
}

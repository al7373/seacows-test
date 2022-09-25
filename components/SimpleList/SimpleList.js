
export default function SimpleList({ 
  data, onApprove
}){
  return data && <ol>
    { data.map(({ id, name, image }) => 
      <li key={ id }>
        <strong>{ name }</strong>
        &nbsp;<button onClick={ () => onApprove(id) }>4.Approve</button>
        &nbsp;<button>5.Swap</button>&nbsp;
        <a href={ image }>{image}</a>
      </li>
    )}
  </ol>
}


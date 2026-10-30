import { Copy, ContentLink } from './Content';
export default function VenueDetails() {
 return <div className="venue-details">
  <div><h3>Besøg os</h3><p>Blågårds Plads 2<br/>2200 København N</p><ContentLink className="venue-inline-link" field="shared.venue.directions">Find vej ↗</ContentLink><p><ContentLink field="shared.venue.emailLink"><Copy field="shared.venue.email"/></ContentLink><br/><ContentLink field="shared.venue.phoneLink"><Copy field="shared.venue.phone"/></ContentLink></p></div>
  <div><h3>Åbningstider · vinter</h3><p><Copy field="shared.venue.hours"/></p></div>
  <div><h3>Følg med</h3><p><ContentLink field="shared.venue.instagram">Instagram ↗</ContentLink><br/><ContentLink field="shared.venue.facebook">Facebook ↗</ContentLink></p><p>Bar & spillested<br/>Fondsdrevet og non-profit</p></div>
 </div>;
}

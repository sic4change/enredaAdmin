import Typography from "@material-ui/core/Typography";
import moment from "moment";
import * as React from "react";
import 'moment/locale/es';

const Aside = ({record}) => (
    <div style={{width: 200, margin: '1em'}}>
        <Typography variant='subtitle1'>Detalles</Typography>
        {record && (
            <>
                <Typography variant="body2" style={{margin: '1em 0'}}>
                    <strong>Fecha de creación:</strong> {moment(record.createdate).utc().locale('es').format('LLL')}
                </Typography>
                <Typography variant="body2" style={{margin: '1em 0'}}>
                    <strong>Fecha de modificación</strong> {moment(record.lastupdate).utc().locale('es').format('LLL')}
                </Typography>
            </>
        )}
    </div>
);

export default Aside;

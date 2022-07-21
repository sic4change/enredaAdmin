import * as React from "react";
import {
    TextInput,
    SimpleForm,
    ReferenceInput,
    BooleanInput,
    SelectInput,
    required,
    FormDataConsumer,
    NumberInput,
    Toolbar,
    SaveButton,
    ReferenceArrayInput,
    SelectArrayInput,
    ChipField,
    Create,
    AutocompleteInput,
} from 'react-admin';
import { connect } from 'react-redux';
import './resourceStyles.scss';
import { useForm } from 'react-final-form';
import moment from "moment";
import { DateTimeInput } from 'react-admin-date-inputs';

const maxPerPage = 999999999999999999999999999999999;

const OnlineInput = ({ formData, ...rest }) => {
    const form = useForm();
    return (<BooleanInput {...rest}
        onChange={(value) => {
            if (value) {
                form.change('address.country', 'undefined');
                form.change('address.province', 'undefined');
                form.change('address.city', 'undefined');
            } else {
                form.change('address.country', null);
                form.change('address.province', null);
                form.change('address.city', null);
            }

        }}

    />);
};

const ResourceTypeInput = ({ formData, ...rest }) => {
    const form = useForm();
    return (<ReferenceInput {...rest}
        onChange={(value) => {
            if (value) {
                form.change('salary', '');
                form.change('contractType', '');
            }
        }}
    />);
};

Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}


const validateStartDay = (value, allValues) => {
    if (!value) {
        return 'La fecha de comienzo es obligatoria';
    }
    return [];
}

const validateEndDay = (value, allValues) => {
    if (!value) {
        return 'La fecha de final es obligatoria';
    }
    if (allValues.end !== null && allValues.end !== undefined && allValues.start !== null && allValues.start !== undefined
        && allValues.end < allValues.start) {
        return 'La fecha de final debe ser mayor que la de inicio';
    }
    return [];
}

const validateMaximumDay = (value, allValues) => {
    if (!value) {
        return 'La fecha máxima de inscripción es obligatoria';
    }
    if (allValues.end !== null && allValues.end !== undefined && allValues.maximumDate !== null && allValues.maximumDate !== undefined
        && allValues.end < allValues.maximumDate) {
        return 'La fecha de final debe ser mayor que la máxima de inscripción';
    }
    return [];
}

const validateCountry = (value, allValues) => {
    if (allValues.modality === 'Online') {
        return [];
    } else {
        if (!value) {
            return 'Debe introducir el país';
        }
        return [];
    }
}

const validateProvince = (value, allValues) => {
    if (allValues.modality === 'Online' || allValues.modality === 'Online para residentes en país') {
        return [];
    } else {
        if (!value) {
            return 'Debe introducir la provincia';
        }
        return [];
    }
}

const validateCity = (value, allValues) => {
    if (allValues.modality === 'Online' || allValues.modality === 'Online para residentes en país' || allValues.modality === 'Online para residentes en provincia') {
        return [];
    } else {
        if (!value) {
            return 'Debe introducir el municipio';
        }
        return [];
    }
}

const validateLink = (value, allValues) => {
    if (value == null && allValues.organizer != null && allValues.promotor != null && allValues.contactEmail == null && allValues.contactPhone == null) {
        return 'Debe introducir un link, e-mail y/o teléfono';
    }
}

const validateContactPhone = (value, allValues) => {
    if (value == null/* && allValues.organizer != null && allValues.promotor != null*/ && allValues.contactEmail == null && allValues.link == null) {
        return 'Debe introducir un link, e-mail y/o teléfono';
    }
}

const validateContactEmail = (value, allValues) => {
    if (value == null/* && allValues.organizer != null && allValues.promotor != null */&& allValues.contactPhone == null && allValues.link == null) {
        return 'Debe introducir un link, e-mail y/o teléfono';
    }

    if (value != null && !String(value).toLowerCase()
          .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          )){
        return 'Introduzca un e-mail válido';
    }
    
}

const ExpireInput = ({ formData, ...rest }) => {
    const form = useForm();
    return (<BooleanInput {...rest}
        onChange={(value) => {
            if (value) {
                form.change('start', new Date('2050-12-31 22:59:00'));
                form.change('end', new Date('2050-12-31 23:59:00'));
                form.change('maximumDate', new Date('2050-12-30 22:59:00'));
            } else {
                form.change('maximumDate', new Date());
                form.change('start', new Date().addHours(1));
                form.change('end', new Date().addHours(2));

            }

        }}

    />);
};

const CountryInput = ({ formData, ...rest }) => {
    const form = useForm();
    return (<SelectInput {...rest}
        input={{
            ...rest.input,
            onChange: value => {
                form.change('address.province', null);
                form.change('address.city', null);
                rest.input.onChange(value);
            },
        }}
    />);
};

const ProvinceInput = ({ formData, ...rest }) => {
    const form = useForm();
    return (<SelectInput {...rest}
        input={{
            ...rest.input,
            onChange: value => {

                form.change('address.city', null);
                rest.input.onChange(value);
            },

        }}
    />);
};

const CreateTitle = () => {
    return <span>Crear recurso</span>;
};



export const ResourceCreateView = ({ permissions, ...props }) => {

    const organizerType = (permissions && !permissions['super-admin'] && props.user.role === 'Mentor') ? 'Mentor' : 'Organización';

    const CreateToolbar = props => (
        <Toolbar {...props}>
            <SaveButton
                transform={data => ({ ...data, assistants: 0, status: 'Disponible', organizerType })}
                submitOnEnter={false}
            />
        </Toolbar>
    );

    const newProps = { ...props };
    delete newProps.onChangeCountry;
    delete newProps.onChangeProvince;
    delete newProps.onChangeOnline;
    delete newProps.onChangeNotExpire;
    delete newProps.formInput;


    let filter;
    if (permissions && permissions['super-admin']) {
        filter = {role: 'Super Admin'}
    } else if (permissions && permissions['organization']){
        filter = {createdby: props.user.email}
    }

    return (<Create {...newProps} title={<CreateTitle />}>
        <SimpleForm className={'resourceGridLayoutCreateEdit'} toolbar={<CreateToolbar />}>
            <TextInput source="title" label="Título" validate={[required()]} />
            <TextInput multiline source="description" label="Descripción" validate={[required()]} />

            <FormDataConsumer>
                {({ formDataProps }) =>
                    <ResourceTypeInput source="resourceType" onChange={props.onResourceTypeChange} label="Tipo de recurso  " reference="resourcesTypes" sort={{ field: 'name', order: 'ASC' }}
                        validate={[required()]}>
                        <SelectInput optionText="name" />
                    </ResourceTypeInput>
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => {
                    if (formData.resourceType === 'QBTbYYx9EUwNtKB68Xfz' || formData.resourceType === 'kUM5r4lSikIPLMZlQ7FD') {
                        return (
                            <TextInput source="contractType" label="Tipo de contrato" />
                        );
                    } else {
                        return (<TextInput source="contractType" label="Tipo de contrato" disabled='true' initialValue='' />);
                    }

                }
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => {
                    if (formData.resourceType === 'QBTbYYx9EUwNtKB68Xfz' || formData.resourceType === 'kUM5r4lSikIPLMZlQ7FD') {
                        return (
                            <TextInput source="salary" label="Salario" />
                        );
                    } else {
                        return (<TextInput source="salary" label="Salario" disabled='true' initialValue='' />);
                    }

                }
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => !formData.resourceType && <DateTimeInput {...rest} source="start" disabled={formData.notExpire}
                    label="Comienzo"
                    options={{ format: 'dd/MM/yyyy, HH:mm' }}
                    validate={validateStartDay} />
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => {
                    if (formData.resourceType === 'N9KdlBYmxUp82gOv8oJC') {
                        return (
                            <SelectInput source="titulation"
                                label='Titulación'
                                validate={[required()]}
                                choices={[
                                    { id: 'Sin titulación', name: 'Sin titulación' },
                                    { id: 'Con titulación no oficial', name: 'Con titulación no oficial' },
                                    { id: 'Con titulación oficial', name: 'Con titulación oficial' },
                                ]}>
                            </SelectInput>
                        );
                    } else {
                        return (<SelectInput source="titulation"
                            disabled='true'
                            label='Titulación'
                            choices={[

                            ]}>
                        </SelectInput>);
                    }

                }
                }
            </FormDataConsumer>

            <ReferenceArrayInput reference="interests" source="interests" label="Intereses" sort={{ field: 'name', order: 'ASC' }}>
                <SelectArrayInput>
                    <ChipField source="name" validate={[required()]} />
                </SelectArrayInput>
            </ReferenceArrayInput>

            <FormDataConsumer>
                {({ formDataProps }) => <ExpireInput label="No expira" source="notExpire" onChange={props.onNotExpiraChange} />
                }
            </FormDataConsumer>


            <FormDataConsumer>
                {({ formData, ...rest }) => !formData.notExpire && <DateTimeInput {...rest} source="start" disabled={formData.notExpire}
                    label="Comienzo"
                    options={{ format: 'dd/MM/yyyy, HH:mm' }}
                    validate={validateStartDay} />
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => !formData.notExpire && <DateTimeInput {...rest} source="end" disabled={formData.notExpire}
                    label="Finalización"
                    options={{ format: 'dd/MM/yyyy, HH:mm' }}
                    validate={validateEndDay} />
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => !formData.notExpire && <DateTimeInput {...rest} disabled={!formData.end}
                    source="maximumDate"
                    options={{ format: 'dd/MM/yyyy, HH:mm' }}
                    label="Fecha máxima de inscripción"
                    validate={validateMaximumDay} />
                }
            </FormDataConsumer>

            <TextInput source="duration" label="Duración" validate={[required()]} />

            <TextInput multiline source="temporality" label="Horario" />

            <FormDataConsumer>
                {({ formData, ...rest }) => {

                    return (
                        <SelectInput source="modality"
                            label='Modalidad'
                            validate={[required()]}
                            onChange={props.onOnlineChange}
                            choices={[
                                { id: 'Presencial', name: 'Presencial' },
                                { id: 'Semipresencial', name: 'Semipresencial' },
                                { id: 'Online para residentes en país', name: 'Online para residentes en país' },
                                { id: 'Online para residentes en provincia', name: 'Online para residentes en provincia' },
                                { id: 'Online para residentes en ciudad', name: 'Online para residentes en ciudad' },
                                { id: 'Online', name: 'Online' },
                            ]}>
                        </SelectInput>
                    );
                }
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => formData.modality !== 'Online' && <ReferenceInput source="address.country"
                    disabled={formData.modality === 'Online'}
                    label="País"
                    reference="countries"
                    sort={{ field: 'name', order: 'ASC' }}
                    filter={{ active: true }}
                    validate={validateCountry}
                    perPage={maxPerPage}
                    onChange={props.onChangeCountry}
                >
                    <FormDataConsumer>
                        {formDataProps => (
                            <CountryInput {...formDataProps} />
                        )}
                    </FormDataConsumer>
                </ReferenceInput>
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => (formData.modality !== 'Online' && formData.modality !== 'Online para residentes en país') && <ReferenceInput source={"address.province"}
                    label="Provincia"
                    onChange={props.onChangeProvince}
                    reference="provinces"
                    sort={{ field: 'name', order: 'ASC' }}
                    perPage={maxPerPage}
                    disabled={(formData.modality === 'Online' && formData.modality === 'Online para residentes en país') || !props.formInput.country}
                    validate={validateProvince}
                    filter={{ active: true } && props.formInput.country && { countryId: props.formInput.country }}
                >
                    <FormDataConsumer>
                        {formDataProps => (
                            <ProvinceInput {...formDataProps} />
                        )}
                    </FormDataConsumer>
                </ReferenceInput>
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => (formData.modality !== 'Online' && formData.modality !== 'Online para residentes en país' && formData.modality !== 'Online para residentes en provincia') && <ReferenceInput source="address.city"
                    label="Municipio"
                    reference="cities"
                    sort={{ field: 'name', order: 'ASC' }}
                    validate={validateCity}
                    perPage={maxPerPage}
                    filter={{ active: true } && props.formInput.province && { provinceId: props.formInput.province }}
                    disabled={(formData.modality === 'Online' && formData.modality === 'Online para residentes en país' && formData.modality === 'Online para residentes en provincia') || !props.formInput.province}
                >
                    <SelectInput optionText="name" />
                </ReferenceInput>
                }
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData, ...rest }) => (formData.modality !== 'Online' && formData.modality !== 'Online para residentes en país' && formData.modality !== 'Online para residentes en provincia' && formData.modality !== 'Online para residentes en ciudad') && <TextInput source="address.street" label="Calle y número" disabled={formData.modality === 'Online' && formData.modality === 'Online para residentes en país' && formData.modality === 'Online para residentes en ciudad'} />
                }
            </FormDataConsumer>



            <TextInput source="address.place" label="Lugar de realización" validate={[required()]} />

            <NumberInput source="capacity" label="Aforo" validate={[required()]} />

            {permissions && (permissions['super-admin']) &&
                <ReferenceInput source="organizer" label="Promotor" reference="organizations" sort={{ field: 'name', order: 'ASC' }}
                    validate={[required()]}>
                    <SelectInput optionText="name" />
                </ReferenceInput>
            }

            {permissions && (!permissions['super-admin'] && props.user.role === 'Mentor') &&
                <ReferenceInput source="organizer" label="Promotor" reference="users" filter={{ userId: props.user.userId }} sort={{ field: 'name', order: 'ASC' }}
                    validate={[required()]}>
                    <SelectInput optionText="firstName" />
                </ReferenceInput>
            }

            {permissions && (!permissions['super-admin'] && props.user.role === 'Organización') &&
                <ReferenceInput source="organizer" label="Promotor" reference="organizations" filter={{ organizationId: props.user.organization }} sort={{ field: 'name', order: 'ASC' }}
                    validate={[required()]}>
                    <SelectInput optionText="name" />
                </ReferenceInput>
            }

            {permissions && (permissions['super-admin']) &&
                <TextInput source="promotor" label="Organizador" />
            }

            {permissions && (!permissions['super-admin'] && props.user.role === 'Mentor') &&
                <TextInput source="promotor" label="Organizador" disabled='true' />
            }

            {permissions && (!permissions['super-admin'] && props.user.role === 'Organización') &&
                <TextInput source="promotor" label="Organizador" />
            }

            <FormDataConsumer>
                {({ formData }) => {
                    return <TextInput  source="link" label="Link" 
                                required={formData.organizer != null && formData.promotor != null && formData.contactEmail == null && formData.contactPhone == null}
                                validate={validateLink}/>;}}
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData }) => {
                    if (formData.organizer != null && formData.promotor != null)
                        return <TextInput   source="contactPhone" label="Teléfono" 
                                            required={formData.organizer != null && formData.promotor != null && formData.contactEmail == null && formData.link == null} 
                                            validate={validateContactPhone} />;}}
            </FormDataConsumer>

            <FormDataConsumer>
                {({ formData }) => {
                    if (formData.organizer != null && formData.promotor != null)
                        return <TextInput   source="contactEmail" label="Email" 
                                            required={formData.organizer != null && formData.promotor != null && formData.contactPhone == null && formData.link == null} 
                                            validate={validateContactEmail} />;}}
            </FormDataConsumer>

            {permissions && permissions['super-admin'] &&
                <BooleanInput source="trust" label="Confianza" defaultValue="true" />
            }

            {permissions && (permissions['super-admin'] && props.user.role === 'Super Admin') &&
                <ReferenceInput
                    source="resourcePictureId"
                    reference="resourcesPictures"
                    label="Foto del recurso"
                    filterToQuery={searchText => ({ name: searchText })}
                    filter={filter}
                    sort={{ field: 'resourcePhoto.title', order: 'ASC' }}
                    validate={[required()]}>
                    <AutocompleteInput optionText="resourcePhoto.title" />
                </ReferenceInput>
            }

            {permissions && (!permissions['super-admin'] && props.user.role === 'Organización') &&
                <ReferenceInput
                    source="resourcePictureId"
                    reference="resourcesPictures"
                    label="Foto del recurso"
                    filterToQuery={searchText => ({ name: searchText })}
                    filter={filter}
                    sort={{ field: 'resourcePhoto.title', order: 'ASC' }}
                    validate={[required()]}>
                    <AutocompleteInput optionText="resourcePhoto.title" />
                </ReferenceInput>
            }

        </SimpleForm>
    </Create>
    )
};

function mapStateToProps(state, props) {
    return { formInput: state.formInput, user: state.user }
}

function mapDispatchToProps(dispatch) {
    return {
        onChangeCountry: (event) => dispatch({ type: 'COUNTRY_SELECTED', value: event.target.value }),
        onChangeProvince: (event) => dispatch({ type: 'PROVINCE_SELECTED', value: event.target.value }),
        onChangeOnline: (event) => dispatch({ type: 'ONLINE_SELECTED', value: event }),
        onChangeNotExpire: (event) => dispatch({ type: 'NOTEXPIRE_SELECTED', value: event })
    };
}

const ResourceCreate = connect(mapStateToProps, mapDispatchToProps)(ResourceCreateView);
export default ResourceCreate;


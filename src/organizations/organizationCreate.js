import * as React from "react";
import {
    TextInput,
    SimpleForm,
    FormDataConsumer,
    CreateController,
    required,
    ImageInput,
    ImageField, ReferenceInput, SelectInput, CreateView, BooleanInput
} from 'react-admin';

import {useForm} from 'react-final-form';
import {connect} from 'react-redux';

import './organizationStyles.scss';

const CreateTitle = () => {
    return <span>Crear organización</span>;
};

const ProvinceInput = ({formData, ...rest}) => {
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

const CountryInput = ({formData, ...rest}) => {
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

const OrganizationCreateView = props => {

    const newProps = {...props};
    delete newProps.onChangeCountry;
    delete newProps.onChangeProvince;
    delete newProps.formInput;

    return (<CreateController {...newProps}>
            {controllerProps =>
                <CreateView {...newProps} {...controllerProps} title={<CreateTitle/>}>
                    <SimpleForm className={'userGridLayoutCreateEdit'}>
                        <TextInput source="name" label="Nombre" validate={[required()]}/>
                        <TextInput multiline source="description" label="Descripción" />
                        <TextInput source="email" type="email" label="Email" validate={[required()]}/>
                        <TextInput source="phone" type="number" label="Teléfono" validate={[required()]}/>
                        <TextInput source="website" label="Sitio web"/>
                        <TextInput source="address.postCode" label="Código Postal"/>
                        
                        <ReferenceInput source="address.country"
                                label="País"
                                reference="countries"
                                sort={{ field: 'name', order: 'ASC' }}
                                filter={{active: true}}
                                validate={[required()]}
                                onChange={props.onChangeCountry}>
                            <FormDataConsumer>
                                {formDataProps => (
                                <CountryInput {...formDataProps} />
                            )}
                            </FormDataConsumer>
                        </ReferenceInput>

                        <ReferenceInput source="address.province"
                                label="Provincia"
                                onChange={props.onChangeProvince}
                                reference="provinces"
                                disabled={!props.formInput.country}
                                sort={{ field: 'name', order: 'ASC' }}
                                validate={[required()]}
                                filter={{active: true} && props.formInput.country && {countryId: props.formInput.country}}>
                            <FormDataConsumer>
                                {formDataProps => (
                                <ProvinceInput {...formDataProps} />
                                )}
                            </FormDataConsumer>
                        </ReferenceInput>

                        <ReferenceInput source="address.city"
                                label="Municipio"
                                reference="cities"
                                sort={{ field: 'name', order: 'ASC' }}
                                validate={[required()]}
                                filter={{active: true} && props.formInput.province && {provinceId: props.formInput.province}}
                                disabled={!props.formInput.province}>
                            <SelectInput optionText="name"/>
                        </ReferenceInput>
                        <BooleanInput source="trust" label="Confiar en sus recursos" validate={[required()]} defaultValue="true"></BooleanInput>
                        <ImageInput source="logoPic" label="Logo de la organización" accept="image/*">
                            <ImageField source="src" title="title"/>
                        </ImageInput>
                        
                    </SimpleForm>
                </CreateView>
            }
        </CreateController>
    )
};

function mapStateToProps(state) {
    return {formInput: state.formInput}
}

function mapDispatchToProps(dispatch) {
    return {
        onChangeCountry: (event) => dispatch({type: 'COUNTRY_SELECTED', value: event.target.value}),
        onChangeProvince: (event) => dispatch({type: 'PROVINCE_SELECTED', value: event.target.value})
    };
}

const OrganizationCreate = connect(mapStateToProps, mapDispatchToProps)(OrganizationCreateView);
export default OrganizationCreate;
